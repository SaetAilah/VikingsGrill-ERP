import pool from '../config/database.js';

export const getSuppliers = async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, contact, email, status FROM suppliers ORDER BY name');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  const { name, contact = '', email = '' } = req.body || {};
  if (!String(name || '').trim()) return res.status(400).json({ error: 'Supplier name is required.' });

  try {
    const [result] = await pool.query(
      'INSERT INTO suppliers (name, contact, email) VALUES (?, ?, ?)',
      [name.trim(), contact, email],
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    next(error);
  }
};

export default { getSuppliers, createSupplier };

