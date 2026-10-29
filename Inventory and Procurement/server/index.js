import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { promisify } from 'node:util';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const app = express();
const port = Number(process.env.PORT || 4002);
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
const requireInventoryManager = (req, res, next) => {
  if (!['Owner', 'Manager'].includes(req.user.role)) return res.status(403).json({ error: 'This inventory management feature is available to managers and the owner.' });
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
app.get('/api/inventory/items', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.id, i.sku, i.name, i.category, i.unit, i.quantity_on_hand AS quantity,
       i.reorder_level AS reorder, ${['Owner', 'Manager'].includes(_req.user.role) ? 'i.unit_cost' : 'NULL'} AS cost, i.is_active, i.item_type AS type,
       COALESCE(s.name, '') AS supplier
       FROM inventory_items i LEFT JOIN suppliers s ON s.id = i.supplier_id
       WHERE i.is_active = 1 ORDER BY i.name`,
    );
    res.json(rows);
  } catch (error) { next(error); }
});
app.post('/api/inventory/items', requireInventoryManager, async (req, res, next) => {
  const { sku, name, category, unit, quantity, reorder, cost, supplier, type = 'Ingredient' } = req.body || {};
  if (!sku || !name || !category || !unit || !Number.isFinite(Number(quantity)) || Number(quantity) < 0 ||
      !Number.isFinite(Number(reorder)) || Number(reorder) < 0 || !Number.isFinite(Number(cost)) || Number(cost) < 0 ||
      !['Ingredient', 'Supply'].includes(type)) {
    return res.status(400).json({ error: 'Provide item details and valid non-negative stock, reorder, and cost values.' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO inventory_items (sku, name, category, unit, quantity_on_hand, reorder_level, unit_cost, item_type, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT id FROM suppliers WHERE name = ? LIMIT 1))`,
      [sku, name, category, unit, quantity, reorder, cost, type, supplier || ''],
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) { next(error); }
});
app.put('/api/inventory/items/:id', requireInventoryManager, async (req, res, next) => {
  const id = Number(req.params.id);
  const { sku, name, category, unit, quantity, reorder, cost, supplier, type = 'Ingredient' } = req.body || {};
  if (!Number.isInteger(id) || !sku || !name || !category || !unit || !Number.isFinite(Number(quantity)) || Number(quantity) < 0 ||
      !Number.isFinite(Number(reorder)) || Number(reorder) < 0 || !Number.isFinite(Number(cost)) || Number(cost) < 0 ||
      !['Ingredient', 'Supply'].includes(type)) {
    return res.status(400).json({ error: 'Provide item details and valid non-negative stock, reorder, and cost values.' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM inventory_items WHERE id = ? AND is_active = 1', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Inventory item was not found.' });
    const [result] = await pool.query(
      `UPDATE inventory_items SET sku = ?, name = ?, category = ?, unit = ?, quantity_on_hand = ?,
       reorder_level = ?, unit_cost = ?, item_type = ?, supplier_id = (SELECT id FROM suppliers WHERE name = ? LIMIT 1)
       WHERE id = ? AND is_active = 1`,
      [sku, name, category, unit, quantity, reorder, cost, type, supplier || '', id],
    );
    res.json({ id });
  } catch (error) { next(error); }
});
app.post('/api/inventory/items/:id/adjustments', async (req, res, next) => {
  const id = Number(req.params.id);
  const quantity = Number(req.body?.quantity);
  const reason = String(req.body?.reason || '').trim();
  if (!Number.isInteger(id) || !Number.isFinite(quantity) || quantity === 0 || !reason || reason.length > 120) {
    return res.status(400).json({ error: 'Provide a valid item, non-zero quantity change, and reason.' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query('SELECT quantity_on_hand FROM inventory_items WHERE id = ? AND is_active = 1 FOR UPDATE', [id]);
    if (!rows.length) throw Object.assign(new Error('Inventory item was not found.'), { statusCode: 404 });
    const current = Number(rows[0].quantity_on_hand);
    if (current + quantity < 0) throw Object.assign(new Error('Adjustment would reduce stock below zero.'), { statusCode: 409 });
    await connection.query('UPDATE inventory_items SET quantity_on_hand = quantity_on_hand + ? WHERE id = ?', [quantity, id]);
    const movementType = reason === 'Stock count correction' ? 'Adjustment' : quantity > 0 ? 'Addition' : 'Deduction';
    await connection.query('INSERT INTO stock_movements (inventory_item_id, movement_type, quantity_change, reason) VALUES (?, ?, ?, ?)',
      [id, movementType, quantity, reason]);
    await connection.commit();
    res.status(201).json({ itemId: id, quantity: current + quantity });
  } catch (error) {
    await connection.rollback();
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  } finally { connection.release(); }
});
app.get('/api/inventory/movements', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.created_at AS date, i.name AS itemName, i.sku, i.unit,
       m.movement_type AS type, m.quantity_change AS quantity, m.reason, m.reference_no AS referenceNo
       FROM stock_movements m JOIN inventory_items i ON i.id = m.inventory_item_id
       ORDER BY m.created_at DESC LIMIT 100`,
    );
    res.json(rows);
  } catch (error) { next(error); }
});
app.get('/api/suppliers', requireInventoryManager, async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, contact, email, status FROM suppliers ORDER BY name');
    res.json(rows);
  } catch (error) { next(error); }
});
app.post('/api/suppliers', requireInventoryManager, async (req, res, next) => {
  const { name, contact = '', email = '' } = req.body || {};
  if (!String(name || '').trim()) return res.status(400).json({ error: 'Supplier name is required.' });
  try {
    const [result] = await pool.query('INSERT INTO suppliers (name, contact, email) VALUES (?, ?, ?)', [name.trim(), contact, email]);
    res.status(201).json({ id: result.insertId });
  } catch (error) { next(error); }
});
app.get('/api/procurement/orders', requireInventoryManager, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.order_no AS id, p.order_no AS orderNumber, s.name AS supplier, p.order_date AS date, p.status,
       COUNT(pi.id) AS lines, SUM(pi.quantity * pi.unit_cost) AS amount
       FROM purchase_orders p JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN purchase_order_items pi ON pi.purchase_order_id = p.id
       GROUP BY p.id ORDER BY p.order_date DESC`,
    );
    res.json(rows);
  } catch (error) { next(error); }
});
app.post('/api/procurement/orders', requireInventoryManager, async (req, res, next) => {
  const supplierId = Number(req.body?.supplierId);
  const itemId = Number(req.body?.itemId);
  const quantity = Number(req.body?.quantity);
  const unitCost = Number(req.body?.unitCost);
  if (!Number.isInteger(supplierId) || !Number.isInteger(itemId) || !Number.isFinite(quantity) || quantity <= 0 ||
      !Number.isFinite(unitCost) || unitCost < 0) {
    return res.status(400).json({ error: 'Choose a valid supplier and item and enter a positive quantity and non-negative unit cost.' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const orderNo = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
    const [orderResult] = await connection.query(
      'INSERT INTO purchase_orders (order_no, supplier_id, order_date, status) VALUES (?, ?, CURRENT_DATE, \'Pending\')',
      [orderNo, supplierId],
    );
    const [itemRows] = await connection.query('SELECT id FROM inventory_items WHERE id = ? AND is_active = 1', [itemId]);
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
  } finally { connection.release(); }
});
app.post('/api/procurement/orders/:orderNo/receive', requireInventoryManager, async (req, res, next) => {
  const orderNo = String(req.params.orderNo);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query('SELECT id, status FROM purchase_orders WHERE order_no = ? FOR UPDATE', [orderNo]);
    if (!orders.length) throw Object.assign(new Error('Purchase order was not found.'), { statusCode: 404 });
    if (orders[0].status !== 'Pending') throw Object.assign(new Error('Only pending purchase orders can be received.'), { statusCode: 409 });
    const [lines] = await connection.query('SELECT inventory_item_id, quantity FROM purchase_order_items WHERE purchase_order_id = ?', [orders[0].id]);
    for (const line of lines) {
      await connection.query('UPDATE inventory_items SET quantity_on_hand = quantity_on_hand + ? WHERE id = ?', [line.quantity, line.inventory_item_id]);
      await connection.query('INSERT INTO stock_movements (inventory_item_id, movement_type, quantity_change, reason, reference_no) VALUES (?, \'Addition\', ?, ?, ?)',
        [line.inventory_item_id, line.quantity, 'Purchase order received', orderNo]);
    }
    await connection.query('UPDATE purchase_orders SET status = \'Received\', received_at = CURRENT_TIMESTAMP WHERE id = ?', [orders[0].id]);
    await connection.commit();
    res.json({ orderNo, status: 'Received', linesReceived: lines.length });
  } catch (error) {
    await connection.rollback();
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  } finally { connection.release(); }
});
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'The inventory request could not be completed.' });
});
app.listen(port, () => console.log(`Inventory API listening on http://localhost:${port}`));
