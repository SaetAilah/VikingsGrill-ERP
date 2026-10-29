import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { promisify } from 'node:util';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const app = express();
const port = Number(process.env.PORT || 4001);
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vikings_erp',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});
app.use(cors());
app.use(express.json({ limit: '32kb' }));

const scrypt = promisify(scryptCallback);
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const hashPassword = async (password, salt = randomBytes(16).toString('hex')) => {
  const derived = await scrypt(password, salt, 64);
  return { salt, digest: derived.toString('hex') };
};
const userView = (user) => ({ id: user.id, name: user.full_name, email: user.email, role: user.role });
const createSession = async (userId) => {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await pool.query('DELETE FROM auth_sessions WHERE expires_at <= CURRENT_TIMESTAMP');
  await pool.query('INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [hashToken(token), userId, expiresAt]);
  return token;
};

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch (error) { res.status(503).json({ status: 'error', error: 'Database connection failed.' }); }
});
app.post('/api/auth/register', async (req, res, next) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190 || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Enter a name, a valid email, and a password between 8 and 128 characters.' });
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
    res.status(201).json({ token: await createSession(user.id), user: userView(user) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });
    next(error);
  } finally {
    if (connection) {
      if (ownerLockAcquired) await connection.query("SELECT RELEASE_LOCK('vikings_erp_first_owner')");
      connection.release();
    }
  }
});
app.post('/api/auth/login', async (req, res, next) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Enter your email and password.' });
  try {
    const [users] = await pool.query('SELECT id, full_name, email, password_hash, role FROM users WHERE email = ? AND is_active = 1 LIMIT 1', [email]);
    const encoded = users[0]?.password_hash || '';
    const [salt, storedDigest] = encoded.split(':');
    const candidate = salt && storedDigest ? await hashPassword(password, salt) : await hashPassword(password, 'invalid-account-salt');
    const matches = Boolean(users[0] && /^[0-9a-f]{128}$/i.test(storedDigest || '') && timingSafeEqual(Buffer.from(candidate.digest, 'hex'), Buffer.from(storedDigest, 'hex')));
    if (!matches) return res.status(401).json({ error: 'Email or password is incorrect.' });
    res.json({ token: await createSession(users[0].id), user: userView(users[0]) });
  } catch (error) { next(error); }
});
const authenticate = async (req, res, next) => {
  const token = req.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]+)$/)?.[1];
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, s.token_hash
       FROM auth_sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1 LIMIT 1`,
      [hashToken(token)],
    );
    if (!rows.length) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    req.user = rows[0];
    req.sessionTokenHash = rows[0].token_hash;
    next();
  } catch (error) { next(error); }
};
app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: userView(req.user) }));
app.post('/api/auth/logout', authenticate, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM auth_sessions WHERE token_hash = ?', [req.sessionTokenHash]);
    res.json({ status: 'signed_out' });
  } catch (error) { next(error); }
});
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/auth/')) return next();
  authenticate(req, res, next);
});
const requireOwner = (req, res, next) => {
  if (req.user.role !== 'Owner') return res.status(403).json({ error: 'Only the owner can manage account roles.' });
  next();
};
const requireMenuEditor = (req, res, next) => {
  if (!['Owner', 'Manager', 'Staff'].includes(req.user.role)) return res.status(403).json({ error: 'Your account cannot manage menu items.' });
  next();
};
const requireSalesManager = (req, res, next) => {
  if (!['Owner', 'Manager'].includes(req.user.role)) return res.status(403).json({ error: 'Sales history is available to managers and the owner.' });
  next();
};
app.get('/api/users', requireOwner, async (_req, res, next) => {
  try {
    const [users] = await pool.query('SELECT id, full_name AS name, email, role FROM users ORDER BY full_name');
    res.json(users);
  } catch (error) { next(error); }
});
app.put('/api/users/:id/role', requireOwner, async (req, res, next) => {
  const id = Number(req.params.id);
  const { role } = req.body || {};
  if (!Number.isSafeInteger(id) || id < 1 || !['Manager', 'Staff'].includes(role)) {
    return res.status(400).json({ error: 'Choose Manager or Staff for a valid account.' });
  }
  try {
    const [result] = await pool.query("UPDATE users SET role = ? WHERE id = ? AND role <> 'Owner'", [role, id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Account not found or owner role cannot be changed here.' });
    res.json({ status: 'updated', id, role });
  } catch (error) { next(error); }
});
app.get('/api/menu', async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, category, price, sku AS code, is_available AS available FROM menu_items ORDER BY category, name');
    res.json(rows);
  } catch (error) { next(error); }
});
const validateMenuItem = (body) => {
  const name = String(body?.name || '').trim();
  const category = String(body?.category || '').trim();
  const code = body?.code == null || String(body.code).trim() === '' ? null : String(body.code).trim();
  const price = Number(body?.price);
  if (!name || name.length > 120 || !category || category.length > 80 || (code && code.length > 40) || !Number.isFinite(price) || price <= 0 || price > 99999999.99) {
    return { error: 'Enter a name, category, and a price greater than zero. The item code is optional.' };
  }
  return { item: { name, category, code, price } };
};
app.post('/api/menu', requireMenuEditor, async (req, res, next) => {
  const { item, error } = validateMenuItem(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const [result] = await pool.query(
      'INSERT INTO menu_items (sku, name, category, price, is_available) VALUES (?, ?, ?, ?, 1)',
      [item.code, item.name, item.category, item.price],
    );
    res.status(201).json({ id: result.insertId });
  } catch (requestError) {
    if (requestError.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That item code is already in use.' });
    next(requestError);
  }
});
app.put('/api/menu/:id', requireMenuEditor, async (req, res, next) => {
  const id = Number(req.params.id);
  const { item, error } = validateMenuItem(req.body);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid menu item.' });
  if (error) return res.status(400).json({ error });
  try {
    const [result] = await pool.query(
      'UPDATE menu_items SET sku = ?, name = ?, category = ?, price = ?, is_available = 1 WHERE id = ?',
      [item.code, item.name, item.category, item.price, id],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Menu item not found.' });
    res.json({ id });
  } catch (requestError) {
    if (requestError.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That item code is already in use.' });
    next(requestError);
  }
});
app.delete('/api/menu/:id', requireMenuEditor, async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid menu item.' });
  try {
    const [result] = await pool.query('UPDATE menu_items SET is_available = 0 WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Menu item not found.' });
    res.json({ status: 'unavailable', id });
  } catch (error) { next(error); }
});
app.get('/api/sales', requireSalesManager, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.receipt_no AS receiptNumber, s.created_at AS date, s.order_type AS tableName,
       s.total_amount AS total, p.method, s.status,
       COALESCE(SUM(si.quantity), 0) AS items
       FROM sales s LEFT JOIN sale_items si ON si.sale_id = s.id
       LEFT JOIN payments p ON p.sale_id = s.id
       GROUP BY s.id, p.id ORDER BY s.created_at DESC LIMIT 200`,
    );
    res.json(rows);
  } catch (error) { next(error); }
});
app.post('/api/sales', async (req, res, next) => {
  const { items, paymentMethod, amountTendered } = req.body || {};
  if (!Array.isArray(items) || items.length === 0 || items.some((item) => !Number.isInteger(Number(item.menuItemId)) || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) ||
      !['Cash', 'Card', 'GCash', 'Maya'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Provide valid order items and a supported payment method.' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const normalized = items.map((item) => ({ id: Number(item.menuItemId), quantity: Number(item.quantity) }));
    const ids = [...new Set(normalized.map((item) => item.id))];
    const [menu] = await connection.query('SELECT id, name, price FROM menu_items WHERE is_available = 1 AND id IN (?) FOR UPDATE', [ids]);
    if (menu.length !== ids.length) throw Object.assign(new Error('One or more menu items are unavailable.'), { statusCode: 409 });
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
      await connection.query('INSERT INTO sale_items (sale_id, menu_item_id, item_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)',
        [saleResult.insertId, line.id, line.product.name, line.quantity, line.product.price, Number(line.product.price) * line.quantity]);
      const [recipes] = await connection.query('SELECT inventory_item_id, quantity_required FROM recipe_ingredients WHERE menu_item_id = ?', [line.id]);
      for (const recipe of recipes) {
        const required = Number(recipe.quantity_required) * line.quantity;
        const [update] = await connection.query(
          'UPDATE inventory_items SET quantity_on_hand = quantity_on_hand - ? WHERE id = ? AND quantity_on_hand >= ?',
          [required, recipe.inventory_item_id, required],
        );
        if (!update.affectedRows) throw Object.assign(new Error('Insufficient ingredient stock; sale was not recorded.'), { statusCode: 409 });
      }
    }
    await connection.query('INSERT INTO payments (sale_id, method, amount, amount_tendered) VALUES (?, ?, ?, ?)',
      [saleResult.insertId, paymentMethod, subtotal, paidAmount]);
    await connection.commit();
    res.status(201).json({ id: receiptNo, total: subtotal, status: 'Completed' });
  } catch (error) {
    await connection.rollback();
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  } finally { connection.release(); }
});
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'The POS request could not be completed.' });
});
app.listen(port, () => console.log(`POS API listening on http://localhost:${port}`));
