import pool from '../config/database.js';

export const getOrders = async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.order_no AS id, p.order_no AS orderNumber, s.name AS supplier, p.order_date AS date, p.status,
              COUNT(pi.id) AS lines, SUM(pi.quantity * pi.unit_cost) AS amount
       FROM purchase_orders p
       JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN purchase_order_items pi ON pi.purchase_order_id = p.id
       GROUP BY p.id
       ORDER BY p.order_date DESC`,
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  const supplierId = Number(req.body?.supplierId);
  const itemId = Number(req.body?.itemId);
  const quantity = Number(req.body?.quantity);
  const unitCost = Number(req.body?.unitCost);

  if (
    !Number.isInteger(supplierId) ||
    !Number.isInteger(itemId) ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(unitCost) ||
    unitCost < 0
  ) {
    return res.status(400).json({
      error: 'Choose a valid supplier and item and enter a positive quantity and non-negative unit cost.',
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const orderNo = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
    const [orderResult] = await connection.query(
      "INSERT INTO purchase_orders (order_no, supplier_id, order_date, status) VALUES (?, ?, CURRENT_DATE, 'Pending')",
      [orderNo, supplierId],
    );

    const [itemRows] = await connection.query(
      'SELECT id FROM inventory_items WHERE id = ? AND is_active = 1',
      [itemId],
    );
    if (!itemRows.length) throw Object.assign(new Error('Inventory item was not found.'), { statusCode: 404 });

    await connection.query(
      'INSERT INTO purchase_order_items (purchase_order_id, inventory_item_id, quantity, unit_cost) VALUES (?, ?, ?, ?)',
      [orderResult.insertId, itemId, quantity, unitCost],
    );

    await connection.commit();
    res.status(201).json({ orderNo });
  } catch (error) {
    await connection.rollback();
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  } finally {
    connection.release();
  }
};

export const receiveOrder = async (req, res, next) => {
  const orderNo = String(req.params.orderNo);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      'SELECT id, status FROM purchase_orders WHERE order_no = ? FOR UPDATE',
      [orderNo],
    );
    if (!orders.length) throw Object.assign(new Error('Purchase order was not found.'), { statusCode: 404 });
    if (orders[0].status !== 'Pending') {
      throw Object.assign(new Error('Only pending purchase orders can be received.'), { statusCode: 409 });
    }

    const [lines] = await connection.query(
      'SELECT inventory_item_id, quantity FROM purchase_order_items WHERE purchase_order_id = ?',
      [orders[0].id],
    );

    for (const line of lines) {
      await connection.query(
        'UPDATE inventory_items SET quantity_on_hand = quantity_on_hand + ? WHERE id = ?',
        [line.quantity, line.inventory_item_id],
      );
      await connection.query(
        "INSERT INTO stock_movements (inventory_item_id, movement_type, quantity_change, reason, reference_no) VALUES (?, 'Addition', ?, ?, ?)",
        [line.inventory_item_id, line.quantity, 'Purchase order received', orderNo],
      );
    }

    await connection.query(
      "UPDATE purchase_orders SET status = 'Received', received_at = CURRENT_TIMESTAMP WHERE id = ?",
      [orders[0].id],
    );

    await connection.commit();
    res.json({ orderNo, status: 'Received', linesReceived: lines.length });
  } catch (error) {
    await connection.rollback();
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  } finally {
    connection.release();
  }
};

export default { getOrders, createOrder, receiveOrder };

