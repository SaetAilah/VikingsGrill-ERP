import pool from '../config/database.js';

export const getMenu = async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, sku AS code, name, category, price, is_available AS available
       FROM menu_items
       ORDER BY category, name`,
    );
    res.json(rows.map((row) => ({
      ...row,
      available: Boolean(row.available),
      price: Number(row.price),
    })));
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req, res, next) => {
  const { code, name, category, price, available = true } = req.body || {};
  const trimmedName = String(name || '').trim();
  const trimmedCategory = String(category || '').trim();
  const trimmedCode = String(code || '').trim();
  const numericPrice = Number(price);

  if (!trimmedName || !trimmedCategory || !trimmedCode || !Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: 'Provide a code, name, category, and non-negative price.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO menu_items (sku, name, category, price, is_available) VALUES (?, ?, ?, ?, ?)',
      [trimmedCode, trimmedName, trimmedCategory, numericPrice, available ? 1 : 0],
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A menu item with this code already exists.' });
    }
    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  const id = Number(req.params.id);
  const { code, name, category, price, available } = req.body || {};
  const trimmedName = String(name || '').trim();
  const trimmedCategory = String(category || '').trim();
  const trimmedCode = String(code || '').trim();
  const numericPrice = Number(price);

  if (!Number.isInteger(id) || !trimmedName || !trimmedCategory || !trimmedCode || !Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: 'Provide a code, name, category, and non-negative price.' });
  }

  try {
    await pool.query(
      'UPDATE menu_items SET sku = ?, name = ?, category = ?, price = ?, is_available = ? WHERE id = ?',
      [trimmedCode, trimmedName, trimmedCategory, numericPrice, available ? 1 : 0, id],
    );
    res.json({ id });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A menu item with this code already exists.' });
    }
    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid menu item ID.' });

  try {
    await pool.query('UPDATE menu_items SET is_available = 0 WHERE id = ?', [id]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export default { getMenu, createMenuItem, updateMenuItem, deleteMenuItem };

