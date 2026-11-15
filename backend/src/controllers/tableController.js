import pool from '../config/database.js';

export const getTables = async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.id, t.table_number, t.capacity, t.area, t.status,
              r.id AS reservation_id, r.reservation_time, r.guests, u.name AS reserved_by
       FROM restaurant_tables t
       LEFT JOIN reservations r ON r.table_id = t.id AND r.status IN ('approved', 'queued', 'seated')
       LEFT JOIN users u ON r.customer_id = u.id
       ORDER BY FIELD(t.area, 'main', 'bar', 'billiards', 'ktv'), t.table_number ASC`,
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const updateTableStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body || {};

  const allowedStatuses = ['available', 'occupied', 'reserved', 'maintenance'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
  }

  try {
    const [result] = await pool.query(
      'UPDATE restaurant_tables SET status = ? WHERE id = ?',
      [status, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Table not found.' });
    }

    res.json({ success: true, id: Number(id), status });
  } catch (error) {
    next(error);
  }
};
