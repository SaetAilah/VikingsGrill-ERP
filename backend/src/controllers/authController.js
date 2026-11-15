import jwt from 'jsonwebtoken';
import env from '../config/env.js';
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
  const phone = String(req.body?.phone || '').trim();
  const requestedRole = String(req.body?.role || '').trim();

  if (
    name.length < 2 ||
    name.length > 80 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 190 ||
    password.length < 6 ||
    password.length > 128
  ) {
    return res.status(400).json({
      error: 'Enter a name, a valid email, and a password with at least 6 characters.',
    });
  }

  const validRoles = [
    'customer',
    'reservation_staff',
    'kitchen_staff',
    'cashier',
    'inventory_staff',
    'hr_staff',
    'accounting_staff',
    'management',
    'Owner',
    'Manager',
    'Staff',
    'administrator',
  ];

  let role = validRoles.includes(requestedRole) ? requestedRole : 'customer';

  let connection;
  try {
    const passwordHash = await hashPassword(password);
    connection = await pool.getConnection();

    const [owners] = await connection.query("SELECT COUNT(*) AS count FROM users WHERE role = 'Owner'");
    if (Number(owners[0].count) === 0) {
      role = 'Owner';
    }

    const [result] = await connection.query(
      'INSERT INTO users (name, email, phone, password_hash, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, passwordHash, passwordHash, role],
    );

    const userId = result.insertId;

    if (role === 'customer') {
      await connection.query(
        'INSERT INTO customer_profiles (user_id, phone) VALUES (?, ?) ON DUPLICATE KEY UPDATE phone = VALUES(phone)',
        [userId, phone],
      );
    }

    const user = { id: userId, name, full_name: name, email, phone, role };
    const token = await createSession(userId);
    res.status(201).json({ token, user: userView(user) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });
    }
    next(error);
  } finally {
    if (connection) connection.release();
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
      'SELECT id, name, name AS full_name, email, phone, password_hash, password, role, role_id, is_active FROM users WHERE email = ?',
      [email],
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid email or password.' });

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'This account has been deactivated. Contact an administrator.' });
    }

    const isValid = await verifyPassword(password, user.password_hash || user.password);
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

export const getSsoToken = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthenticated.' });

    const target = req.query.target || 'reservation';

    if (target === 'accounting' || target === 'payroll' || target === 'jewel') {
      const jewelSecret = process.env.JEWEL_JWT_SECRET || 'viking_grill_jewel_jwt_secret_2026';
      const jewelToken = jwt.sign(
        {
          id: user.id,
          name: user.name || user.full_name,
          email: user.email,
          role: user.role,
          employeeId: user.employee_id || user.id,
        },
        jewelSecret,
        { expiresIn: '8h' },
      );

      const path = target === 'payroll' ? '/hr/payroll' : '/accounting/dashboard';
      return res.json({
        token: jewelToken,
        url: `http://localhost:5177${path}?token=${encodeURIComponent(jewelToken)}`,
      });
    }

    if (target === 'feedback' || target === 'crm' || target === 'customer_feedback') {
      const feedbackSecret = process.env.FEEDBACK_JWT_SECRET || 'vikings_secret_key';
      const isCustomer = user.role === 'customer' || user.role === 'Customer';
      const roleName = isCustomer ? 'Customer' : (user.role === 'Manager' ? 'Manager' : 'Owner');
      const roleId = isCustomer ? 6 : (user.role === 'Manager' ? 2 : 1);
      const feedbackToken = jwt.sign(
        {
          id: user.id,
          name: user.name || user.full_name,
          email: user.email,
          role_id: roleId,
          role: roleName,
        },
        feedbackSecret,
        { expiresIn: '24h' },
      );

      const path = isCustomer ? '/feedback' : '/management/feedback';
      return res.json({
        token: feedbackToken,
        url: `http://localhost:5178${path}?token=${encodeURIComponent(feedbackToken)}`,
      });
    }

    const ssoToken = jwt.sign(
      {
        id: user.id,
        name: user.name || user.full_name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: '24h' },
    );

    let destinationPath = '/staff/reservations';
    if (user.role === 'customer') destinationPath = '/menu';
    else if (user.role === 'kitchen_staff') destinationPath = '/kitchen/orders';
    else if (['Owner', 'Manager', 'management'].includes(user.role)) destinationPath = '/management/dashboard';

    res.json({
      token: ssoToken,
      url: `http://localhost:5176${destinationPath}?token=${encodeURIComponent(ssoToken)}`,
    });
  } catch (error) {
    next(error);
  }
};
