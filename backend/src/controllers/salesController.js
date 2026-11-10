import pool from '../config/database.js';

export const getSales = async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.receipt_no AS receiptNumber, s.receipt_no AS id, s.created_at AS date,
              s.order_type AS tableName, s.total_amount AS total, p.method, s.status,
              COUNT(si.id) AS items
       FROM sales s
       LEFT JOIN payments p ON p.sale_id = s.id
       LEFT JOIN sale_items si ON si.sale_id = s.id
       GROUP BY s.id, p.method
       ORDER BY s.created_at DESC
       LIMIT 100`,
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const createSale = async (req, res, next) => {
  const { items, paymentMethod, amountTendered } = req.body || {};

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.some(
      (item) =>
        !Number.isInteger(Number(item.menuItemId)) ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1,
    ) ||
    !['Cash', 'Card', 'GCash', 'Maya'].includes(paymentMethod)
  ) {
    return res.status(400).json({ error: 'Provide valid order items and a supported payment method.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const normalized = items.map((item) => ({
      id: Number(item.menuItemId),
      quantity: Number(item.quantity),
    }));
    const ids = [...new Set(normalized.map((item) => item.id))];

    const [menu] = await connection.query(
      'SELECT id, name, price FROM menu_items WHERE is_available = 1 AND id IN (?) FOR UPDATE',
      [ids],
    );
    if (menu.length !== ids.length) {
      throw Object.assign(new Error('One or more menu items are unavailable.'), { statusCode: 409 });
    }

    const menuById = new Map(menu.map((item) => [Number(item.id), item]));
    const lines = normalized.map((item) => ({ ...item, product: menuById.get(item.id) }));
    const subtotal = lines.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    const paidAmount = Number(amountTendered);

    if (!Number.isFinite(paidAmount) || (paymentMethod === 'Cash' && paidAmount < subtotal)) {
      throw Object.assign(new Error('Amount tendered must cover the order total.'), { statusCode: 400 });
    }

    const receiptNo = `VG-${Date.now()}`;
    const [saleResult] = await connection.query(
      `INSERT INTO sales (receipt_no, order_type, subtotal, tax_amount, total_amount, status)
       VALUES (?, 'Walk-in', ?, 0, ?, 'Completed')`,
      [receiptNo, subtotal, subtotal],
    );

    for (const line of lines) {
      await connection.query(
        'INSERT INTO sale_items (sale_id, menu_item_id, item_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)',
        [saleResult.insertId, line.id, line.product.name, line.quantity, line.product.price, Number(line.product.price) * line.quantity],
      );

      const [recipes] = await connection.query(
        'SELECT inventory_item_id, quantity_required FROM recipe_ingredients WHERE menu_item_id = ?',
        [line.id],
      );

      for (const recipe of recipes) {
        const required = Number(recipe.quantity_required) * line.quantity;

        const [update] = await connection.query(
          'UPDATE inventory_items SET quantity_on_hand = quantity_on_hand - ? WHERE id = ? AND quantity_on_hand >= ?',
          [required, recipe.inventory_item_id, required],
        );
        if (!update.affectedRows) {
          throw Object.assign(new Error('Insufficient ingredient stock; sale was not recorded.'), { statusCode: 409 });
        }

        // Audit Trail: Record deduction in stock_movements
        await connection.query(
          `INSERT INTO stock_movements (inventory_item_id, movement_type, quantity_change, reason, reference_no)
           VALUES (?, 'Deduction', ?, 'POS Sale', ?)`,
          [recipe.inventory_item_id, -required, receiptNo],
        );
      }
    }

    await connection.query(
      'INSERT INTO payments (sale_id, method, amount, amount_tendered) VALUES (?, ?, ?, ?)',
      [saleResult.insertId, paymentMethod, subtotal, paidAmount],
    );

    await connection.commit();
    res.status(201).json({ id: receiptNo, total: subtotal, status: 'Completed' });
  } catch (error) {
    await connection.rollback();
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  } finally {
    connection.release();
  }
};

export default { getSales, createSale };

