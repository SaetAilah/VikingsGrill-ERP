import pool from '../config/database.js';

export const getItems = async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.id, i.sku, i.name, i.category, i.unit,
              i.quantity_on_hand AS quantity,
              i.reorder_level AS reorder,
              i.unit_cost AS cost,
              i.item_type AS type,
              s.name AS supplier,
              i.supplier_id AS supplierId
       FROM inventory_items i
       LEFT JOIN suppliers s ON s.id = i.supplier_id
       WHERE i.is_active = 1
       ORDER BY i.category, i.name`,
    );
    res.json(rows.map((row) => ({
      ...row,
      quantity: Number(row.quantity),
      reorder: Number(row.reorder),
      cost: Number(row.cost),
    })));
  } catch (error) {
    next(error);
  }
};

export const createItem = async (req, res, next) => {
  const { sku, name, category, unit, quantity = 0, reorder = 0, cost = 0, type = 'Ingredient', supplierId = null } = req.body || {};
  const trimmedName = String(name || '').trim();
  const trimmedCategory = String(category || '').trim();
  const trimmedUnit = String(unit || '').trim();
  const trimmedSku = String(sku || '').trim() || null;
  const numQuantity = Number(quantity);
  const numReorder = Number(reorder);
  const numCost = Number(cost);

  if (!trimmedName || !trimmedCategory || !trimmedUnit || !['Ingredient', 'Supply'].includes(type) ||
      !Number.isFinite(numQuantity) || numQuantity < 0 ||
      !Number.isFinite(numReorder) || numReorder < 0 ||
      !Number.isFinite(numCost) || numCost < 0) {
    return res.status(400).json({ error: 'Provide valid item details, positive/zero stock levels, and non-negative cost.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO inventory_items (sku, name, category, unit, quantity_on_hand, reorder_level, unit_cost, item_type, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [trimmedSku, trimmedName, trimmedCategory, trimmedUnit, numQuantity, numReorder, numCost, type, supplierId || null],
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An item with this SKU already exists.' });
    }
    next(error);
  }
};

export const updateItem = async (req, res, next) => {
  const id = Number(req.params.id);
  const { sku, name, category, unit, reorder = 0, cost = 0, type = 'Ingredient', supplierId = null } = req.body || {};
  const trimmedName = String(name || '').trim();
  const trimmedCategory = String(category || '').trim();
  const trimmedUnit = String(unit || '').trim();
  const trimmedSku = String(sku || '').trim() || null;
  const numReorder = Number(reorder);
  const numCost = Number(cost);

  if (!Number.isInteger(id) || !trimmedName || !trimmedCategory || !trimmedUnit || !['Ingredient', 'Supply'].includes(type) ||
      !Number.isFinite(numReorder) || numReorder < 0 ||
      !Number.isFinite(numCost) || numCost < 0) {
    return res.status(400).json({ error: 'Provide valid item details.' });
  }

  try {
    await pool.query(
      `UPDATE inventory_items
       SET sku = ?, name = ?, category = ?, unit = ?, reorder_level = ?, unit_cost = ?, item_type = ?, supplier_id = ?
       WHERE id = ?`,
      [trimmedSku, trimmedName, trimmedCategory, trimmedUnit, numReorder, numCost, type, supplierId || null, id],
    );
    res.json({ id });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An item with this SKU already exists.' });
    }
    next(error);
  }
};

export const recordAdjustment = async (req, res, next) => {
  const id = Number(req.params.id);
  const quantity = Number(req.body?.quantity);
  const reason = String(req.body?.reason || '').trim();

  if (!Number.isInteger(id) || !Number.isFinite(quantity) || quantity === 0 || !reason || reason.length > 120) {
    return res.status(400).json({ error: 'Provide a valid item, non-zero quantity change, and reason.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT quantity_on_hand FROM inventory_items WHERE id = ? AND is_active = 1 FOR UPDATE',
      [id],
    );
    if (!rows.length) throw Object.assign(new Error('Inventory item was not found.'), { statusCode: 404 });

    const current = Number(rows[0].quantity_on_hand);
    if (current + quantity < 0) {
      throw Object.assign(new Error('Adjustment would reduce stock below zero.'), { statusCode: 409 });
    }

    await connection.query('UPDATE inventory_items SET quantity_on_hand = quantity_on_hand + ? WHERE id = ?', [quantity, id]);

    const movementType = reason === 'Stock count correction' ? 'Adjustment' : quantity > 0 ? 'Addition' : 'Deduction';
    await connection.query(
      'INSERT INTO stock_movements (inventory_item_id, movement_type, quantity_change, reason) VALUES (?, ?, ?, ?)',
      [id, movementType, quantity, reason],
    );

    await connection.commit();
    res.status(201).json({ itemId: id, quantity: current + quantity });
  } catch (error) {
    await connection.rollback();
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  } finally {
    connection.release();
  }
};

export const getMovements = async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.created_at AS date, i.name AS itemName, i.sku, i.unit,
              m.movement_type AS type, m.quantity_change AS quantity, m.reason, m.reference_no AS referenceNo
       FROM stock_movements m
       JOIN inventory_items i ON i.id = m.inventory_item_id
       ORDER BY m.created_at DESC
       LIMIT 100`,
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export default { getItems, createItem, updateItem, recordAdjustment, getMovements };

