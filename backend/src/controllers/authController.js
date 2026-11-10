import pool from '../config/database.js';
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateSessionToken,
  userView,
} from '../utils/crypto.js';

const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

const createSession = async (userId) => {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  await pool.query('DELETE FROM auth_sessions WHERE expires_at <= CURRENT_TIMESTAMP');
  await pool.query(
    'INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
    [hashToken(token), userId, expiresAt],
  );
  return token;
};

export const register = async (req, res, next) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (
    name.length < 2 ||
    name.length > 80 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 190 ||
    password.length < 8 ||
    password.length > 128
  ) {
    return res.status(400).json({
      error: 'Enter a name, a valid email, and a password between 8 and 128 characters.',
    });
  }

  let connection;
  let ownerLockAcquired = false;
  try {
    const passwordHash = await hashPassword(password);
    connection = await pool.getConnection();
    const [lockRows] = await connection.query("SELECT GET_LOCK('vikings_erp_first_owner', 10) AS acquired");
    ownerLockAcquired = Number(lockRows[0].acquired) === 1;
    if (!ownerLockAcquired) return res.status(503).json({ error: 'Account setup is busy. Please try again.' });

    const [owners] = await connection.query("SELECT COUNT(*) AS count FROM users WHERE role = 'Owner'");
    const role = Number(owners[0].count) === 0 ? 'Owner' : 'Staff';

    const [result] = await connection.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, `${passwordHash.salt}:${passwordHash.digest}`, role],
    );

    const user = { id: result.insertId, full_name: name, email, role };
    const token = await createSession(user.id);
    res.status(201).json({ token, user: userView(user) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });
    }
    next(error);
  } finally {
    if (connection) {
      if (ownerLockAcquired) {
        await connection.query("SELECT RELEASE_LOCK('vikings_erp_first_owner')").catch(() => {});
      }
      connection.release();
    }
  }
};

export const login = async (req, res, next) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = ?',
      [email],
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid email or password.' });

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'This account has been deactivated. Contact an administrator.' });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = await createSession(user.id);
    res.json({ token, user: userView(user) });
  } catch (error) {
    next(error);
  }
};

export const me = (req, res) => {
  res.json({ user: userView(req.user) });
};

export const logout = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return res.status(204).end();

  try {
    await pool.query('DELETE FROM auth_sessions WHERE token_hash = ?', [hashToken(token)]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export default { register, login, me, logout };

