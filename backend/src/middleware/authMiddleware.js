import pool from '../config/database.js';
import { hashToken } from '../utils/crypto.js';

export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });

  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.is_active
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1`,
      [hashToken(token)],
    );
    if (!rows.length) return res.status(401).json({ error: 'Session expired. Sign in again.' });
    req.user = rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;

