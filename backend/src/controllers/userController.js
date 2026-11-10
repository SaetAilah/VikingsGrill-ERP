import pool from '../config/database.js';

export const getUsers = async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name AS name, email, role, is_active AS isActive FROM users ORDER BY id',
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  const targetId = Number(req.params.id);
  const nextRole = String(req.body?.role || '').trim();

  if (!Number.isInteger(targetId) || !['Manager', 'Staff'].includes(nextRole)) {
    return res.status(400).json({ error: 'Select a valid role of Manager or Staff.' });
  }

  try {
    const [targets] = await pool.query('SELECT id, role FROM users WHERE id = ?', [targetId]);
    if (!targets.length) return res.status(404).json({ error: 'User was not found.' });
    if (targets[0].role === 'Owner') {
      return res.status(400).json({ error: 'The Owner role cannot be reassigned through this screen.' });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [nextRole, targetId]);
    res.json({ id: targetId, role: nextRole });
  } catch (error) {
    next(error);
  }
};

export default { getUsers, updateUserRole };

