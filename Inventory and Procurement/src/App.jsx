import React, { useEffect, useMemo, useState } from 'react';
import AuthGate from './Auth.jsx';
import { apiFetch } from './auth.js';

const itemSeed = [
  { id: 1, sku: 'ING-001', name: 'Pork belly', category: 'Meat & poultry', unit: 'kg', quantity: 18.5, reorder: 10, cost: 285, supplier: 'Mindoro Fresh Meats', type: 'Ingredient' },
  { id: 2, sku: 'ING-002', name: 'Chicken leg quarters', category: 'Meat & poultry', unit: 'kg', quantity: 7.2, reorder: 12, cost: 195, supplier: 'Mindoro Fresh Meats', type: 'Ingredient' },
  { id: 3, sku: 'ING-003', name: 'Jasmine rice', category: 'Dry goods', unit: 'kg', quantity: 42, reorder: 20, cost: 58, supplier: 'Roxas Grain Trading', type: 'Ingredient' },
  { id: 4, sku: 'ING-004', name: 'Cooking oil', category: 'Dry goods', unit: 'L', quantity: 6, reorder: 8, cost: 112, supplier: 'Roxas Grain Trading', type: 'Ingredient' },
  { id: 5, sku: 'ING-005', name: 'Kangkong', category: 'Produce', unit: 'kg', quantity: 3.4, reorder: 5, cost: 65, supplier: 'Bongabong Produce Co.', type: 'Ingredient' },
  { id: 6, sku: 'ING-006', name: 'Coconut milk', category: 'Canned & chilled', unit: 'L', quantity: 11, reorder: 6, cost: 94, supplier: 'Oriental Food Supply', type: 'Ingredient' },
  { id: 7, sku: 'SUP-001', name: 'Takeaway food containers', category: 'Packaging', unit: 'pcs', quantity: 36, reorder: 50, cost: 4.5, supplier: 'Oriental Food Supply', type: 'Supply' },
  { id: 8, sku: 'SUP-002', name: 'Kitchen gloves', category: 'Cleaning & safety', unit: 'box', quantity: 14, reorder: 5, cost: 72, supplier: 'Oriental Food Supply', type: 'Supply' },
];
const supplierSeed = [
  { id: 1, name: 'Mindoro Fresh Meats', contact: '0917 555 0124', email: 'orders@mindorofresh.example', items: 'Meat & poultry', status: 'Active' },
  { id: 2, name: 'Roxas Grain Trading', contact: '0918 345 6677', email: 'sales@roxasgrain.example', items: 'Rice & dry goods', status: 'Active' },
  { id: 3, name: 'Bongabong Produce Co.', contact: '0920 111 4088', email: 'produce@bongabong.example', items: 'Fresh produce', status: 'Active' },
  { id: 4, name: 'Oriental Food Supply', contact: '043 288 9500', email: 'hello@orientalfood.example', items: 'Packaging & supplies', status: 'Active' },
];
const orderSeed = [
  { id: 'PO-2026-018', supplier: 'Mindoro Fresh Meats', date: '2026-10-16', lines: 3, amount: 12750, status: 'Pending', itemId: 1, quantity: 45 },
  { id: 'PO-2026-017', supplier: 'Bongabong Produce Co.', date: '2026-10-15', lines: 4, amount: 4620, status: 'Received' },
  { id: 'PO-2026-016', supplier: 'Roxas Grain Trading', date: '2026-10-13', lines: 2, amount: 8100, status: 'Received' },
];
const movementSeed = [];
const navigation = [
  ['Inventory Dashboard', 'DB'], ['Inventory Items', 'IT'], ['Ingredient Management', 'IG'],
  ['Stock Levels', 'SL'], ['Stock Movement / Adjustments', 'SM'], ['Supplier Management', 'SU'],
  ['Procurement / Purchase Orders', 'PO'], ['Low-Stock / Reorder Alerts', 'AL'], ['Inventory Reports', 'RP'],
];
const staffInventoryPages = ['Inventory Items', 'Ingredient Management', 'Stock Levels', 'Stock Movement / Adjustments', 'Low-Stock / Reorder Alerts'];
const money = (value) => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const number = (value) => Number(value || 0).toLocaleString('en-PH', { maximumFractionDigits: 3 });

function App() {
  return <AuthGate>{({ user, onLogout }) => <InventoryWorkspace user={user} onLogout={onLogout} />}</AuthGate>;
}

function InventoryWorkspace({ user, onLogout }) {
  const isOwner = user.role === 'Owner';
  const canManageInventory = isOwner || user.role === 'Manager';
  const managerInventoryPages = navigation.map(([label]) => label);
  const allowedPages = isOwner ? navigation.map(([label]) => label) : canManageInventory ? managerInventoryPages : staffInventoryPages;
  const [page, setPage] = useState(isOwner ? 'Inventory Dashboard' : 'Inventory Items');
  const [accountOpen, setAccountOpen] = useState(false);
  const [items, setItems] = useState(() => load('vikings-inventory-items', itemSeed));
  const [suppliers, setSuppliers] = useState(() => load('vikings-inventory-suppliers', supplierSeed));
  const [orders, setOrders] = useState(() => load('vikings-inventory-orders', orderSeed));
  const [movements, setMovements] = useState(() => load('vikings-inventory-movements', movementSeed));
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [modal, setModal] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [notice, setNotice] = useState('');
  const [apiStatus, setApiStatus] = useState(user.demo ? 'Demo mode · Browser-local data' : 'Checking API');
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'U';
  const lowStock = items.filter((item) => Number(item.quantity) <= Number(item.reorder));

  useEffect(() => {
    if (!allowedPages.includes(page)) setPage(allowedPages[0]);
  }, [user.role, page]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (user.demo) {
        setApiStatus('Demo mode · Browser-local data');
        return;
      }
      const requests = [apiFetch('/api/inventory/items'), apiFetch('/api/inventory/movements')];
      if (canManageInventory) requests.push(apiFetch('/api/suppliers'), apiFetch('/api/procurement/orders'));
      try {
        const responses = await Promise.all(requests);
        if (responses.some((response) => !response.ok)) throw new Error('Inventory API is unavailable.');
        const [inventory, movementRows, vendorRows, purchaseOrders] = await Promise.all(responses.map((response) => response.json()));
        if (!active) return;
        if (Array.isArray(inventory)) setItems(inventory);
        if (Array.isArray(movementRows)) setMovements(movementRows);
        if (Array.isArray(vendorRows)) setSuppliers(vendorRows.map((vendor) => ({ ...vendor, items: 'Supplier' })));
        if (Array.isArray(purchaseOrders)) setOrders(purchaseOrders);
        setApiStatus('Connected to VikingsERP');
      } catch {
        if (active) setApiStatus('Demo mode · API not connected');
      }
    };
    refresh();
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [canManageInventory, user.demo]);
  useEffect(() => { localStorage.setItem('vikings-inventory-items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('vikings-inventory-suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('vikings-inventory-orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('vikings-inventory-movements', JSON.stringify(movements)); }, [movements]);

  const pageItems = useMemo(() => {
    let result = items;
    if (page === 'Ingredient Management') result = result.filter((item) => item.type === 'Ingredient');
    if (page === 'Low-Stock / Reorder Alerts') result = lowStock;
    return result.filter((item) => {
      const termMatch = `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(query.toLowerCase());
      const typeMatch = page !== 'Inventory Items' || typeFilter === 'All' || item.type === typeFilter;
      return termMatch && typeMatch;
    });
  }, [items, page, lowStock, query, typeFilter]);

  useEffect(() => {
    if (!allowedPages.includes(page)) setPage(allowedPages[0]);
  }, [allowedPages, page]);

  const recordAdjustment = async (item, amount, reason) => {
    const quantity = Number(amount);
    if (!Number.isFinite(quantity) || quantity === 0 || Number(item.quantity) + quantity < 0) {
      setNotice('Enter a valid adjustment that does not reduce stock below zero.');
      return false;
    }
    if (apiStatus === 'Connected to VikingsERP') {
      try {
        const response = await apiFetch(`/api/inventory/items/${item.id}/adjustments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity, reason }),
        });
        if (!response.ok) {
          const problem = await response.json().catch(() => ({}));
          setNotice(problem.error || 'The stock adjustment was rejected by the server.');
          return false;
        }
      } catch { setApiStatus('Demo mode · API not connected'); }
    } else setApiStatus('Demo mode · API not connected');
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, quantity: Number(row.quantity) + quantity } : row));
    setMovements((current) => [{
      id: Date.now(),
      date: new Date().toISOString(),
      itemName: item.name,
      sku: item.sku,
      unit: item.unit,
      type: reason === 'Stock count correction' ? 'Adjustment' : quantity > 0 ? 'Addition' : 'Deduction',
      quantity,
      reason,
    }, ...current]);
    setNotice(`Stock updated for ${item.name}.`);
    return true;
  };
  const saveItem = async (form) => {
    const parsed = { ...form, quantity: Number(form.quantity), reorder: Number(form.reorder), cost: Number(form.cost) };
    if (!parsed.name.trim() || !parsed.sku.trim() || !Number.isFinite(parsed.quantity) || parsed.quantity < 0 || !Number.isFinite(parsed.reorder) || parsed.reorder < 0 || !Number.isFinite(parsed.cost) || parsed.cost < 0) {
      setNotice('Complete the item fields using non-negative numbers.');
      return false;
    }
    if (selectedItem) {
      if (apiStatus === 'Connected to VikingsERP') {
        try {
          const response = await apiFetch(`/api/inventory/items/${selectedItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed),
          });
          if (!response.ok) {
            const problem = await response.json().catch(() => ({}));
            setNotice(problem.error || 'The item could not be updated by the server.');
            return false;
          }
        } catch { setApiStatus('Demo mode · API not connected'); }
      } else setApiStatus('Demo mode · API not connected');
      setItems((current) => current.map((row) => row.id === selectedItem.id ? { ...row, ...parsed } : row));
    } else {
      const created = { ...parsed, id: Date.now() };
      if (apiStatus === 'Connected to VikingsERP') {
        try {
          const response = await apiFetch('/api/inventory/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) });
          if (response.ok) {
            const saved = await response.json();
            created.id = saved.id;
          } else {
            const problem = await response.json().catch(() => ({}));
            setNotice(problem.error || 'The item could not be saved by the server.');
            return false;
          }
        } catch { setApiStatus('Demo mode · API not connected'); }
      } else setApiStatus('Demo mode · API not connected');
      setItems((current) => [created, ...current]);
    }
    setModal('');
    setNotice(selectedItem ? 'Inventory item updated.' : 'Inventory item created.');
    return true;
  };
  const createSupplier = async (supplier) => {
    if (apiStatus === 'Connected to VikingsERP') {
      try {
        const response = await apiFetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supplier),
        });
        if (response.ok) {
          const saved = await response.json();
          setSuppliers((current) => [{ id: saved.id, ...supplier, items: 'New supplier', status: 'Active' }, ...current]);
        } else {
          const problem = await response.json().catch(() => ({}));
          setNotice(problem.error || 'The supplier could not be saved by the server.');
          return;
        }
      } catch {
        setSuppliers((current) => [{ id: Date.now(), ...supplier, items: 'New supplier', status: 'Active' }, ...current]);
        setApiStatus('Demo mode · API not connected');
      }
    } else {
      setSuppliers((current) => [{ id: Date.now(), ...supplier, items: 'New supplier', status: 'Active' }, ...current]);
      setApiStatus('Demo mode · API not connected');
    }
    setModal('');
    setNotice('Supplier added.');
  };
  const createPurchaseOrder = async (supplier, itemId, quantity) => {
    const item = items.find((row) => String(row.id) === String(itemId));
    const vendor = suppliers.find((row) => String(row.id) === String(supplier));
    const qty = Number(quantity);
    if (!item || !vendor || !Number.isFinite(qty) || qty <= 0) return setNotice('Choose a supplier and item, then enter a quantity greater than zero.');
    const order = { id: `PO-2026-${String(orders.length + 19).padStart(3, '0')}`, supplier: vendor.name, date: new Date().toISOString().slice(0, 10), lines: 1, amount: qty * Number(item.cost), status: 'Pending', itemId: item.id, quantity: qty };
    if (apiStatus === 'Connected to VikingsERP') {
      try {
        const response = await apiFetch('/api/procurement/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplierId: vendor.id, itemId: item.id, quantity: qty, unitCost: item.cost }),
        });
        if (response.ok) {
          const saved = await response.json();
          order.id = saved.orderNo;
        } else {
          const problem = await response.json().catch(() => ({}));
          setNotice(problem.error || 'The purchase order could not be saved by the server.');
          return;
        }
      } catch { setApiStatus('Demo mode · API not connected'); }
    } else setApiStatus('Demo mode · API not connected');
    setOrders((current) => [order, ...current]);
    setNotice(`${order.id} created and awaiting receipt.`);
    setModal('');
  };
  const receiveOrder = async (order) => {
    let savedToApi = false;
    if (apiStatus === 'Connected to VikingsERP') {
      try {
        const response = await apiFetch(`/api/procurement/orders/${encodeURIComponent(order.id)}/receive`, { method: 'POST' });
        if (response.ok) savedToApi = true;
        else {
          const problem = await response.json().catch(() => ({}));
          setNotice(problem.error || 'The purchase order could not be received.');
          return;
        }
      } catch { setApiStatus('Demo mode · API not connected'); }
    } else setApiStatus('Demo mode · API not connected');
    setOrders((current) => current.map((row) => row.id === order.id ? { ...row, status: 'Received' } : row));
    if (savedToApi) {
      try {
        const response = await apiFetch('/api/inventory/items');
        if (!response.ok) return setNotice('Order was received, but refreshed stock levels could not be loaded.');
        const freshItems = await response.json();
        setItems(freshItems);
        const movementResponse = await apiFetch('/api/inventory/movements');
        if (movementResponse.ok) setMovements(await movementResponse.json());
        else return setNotice('Order was received and stock refreshed, but movement history could not be refreshed.');
      } catch {
        return setNotice('Order was received, but refreshed inventory data could not be loaded.');
      }
    } else if (order.itemId) {
      setItems((current) => current.map((item) => item.id === order.itemId ? { ...item, quantity: Number(item.quantity) + Number(order.quantity) } : item));
      const orderItem = items.find((item) => item.id === order.itemId);
      if (orderItem) setMovements((current) => [{
        id: Date.now(),
        date: new Date().toISOString(),
        itemName: orderItem.name,
        sku: orderItem.sku,
        unit: orderItem.unit,
        type: 'Addition',
        quantity: Number(order.quantity),
        reason: 'Purchase order received',
        referenceNo: order.id,
      }, ...current]);
    }
    setNotice(`${order.id} marked received. Stock levels have been updated.`);
  };

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">VG</div><div><strong>VIKING GRILL</strong><small>BAR · BILLIARDS · KTV</small></div></div><div className="workspace-label">WORKSPACE</div><div className="location-switch"><span className="location-dot" /> Roxas Branch <span className="chevron">⌄</span></div><div className="nav-label">INVENTORY & PROCUREMENT</div><nav>{navigation.filter(([label]) => allowedPages.includes(label)).map(([label, glyph]) => <button key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => { setPage(label); setQuery(''); }}><span className="nav-glyph">{glyph}</span><span>{label}</span>{label === 'Low-Stock / Reorder Alerts' && lowStock.length > 0 && <b className="nav-count">{lowStock.length}</b>}</button>)}</nav><button className="sidebar-bottom profile-trigger" onClick={() => setAccountOpen(true)} aria-label="Open account menu"><span className="user-avatar">{initials}</span><span className="user-copy"><strong>{user.name}</strong><small>{user.demo ? 'Demo mode' : user.role}</small></span><span className="more-button">⌄</span></button></aside>
    <main className="main-area"><header className="topbar"><div className="breadcrumbs"><span>Operations</span><b>/</b><strong>{page}</strong></div><div className="top-actions"><span className="live-status"><i /> Inventory active</span><span className="top-divider" /><span className="current-time">{new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}</span><button className="top-avatar profile-avatar-button" onClick={() => setAccountOpen(true)} aria-label="Open account menu">{initials}</button></div></header>
      <div className="page-content">{page !== 'Inventory Dashboard' && <div className="welcome-row"><div><p className="eyebrow">VIKINGS GRILL <span>·</span> ROXAS BRANCH</p><h1>{page}</h1><p className="subtitle">{subtitle(page)}</p></div><div className="date-chip"><span className="calendar-icon">▦</span>{new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div></div>}
        {apiStatus.startsWith('Demo') && <div className="api-notice"><span className="notice-dot" /> {apiStatus}. Changes are saved in this browser for preview.</div>}
        {notice && <div className="notice-banner"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
        {page === 'Inventory Dashboard' && canManageInventory && <Dashboard items={items} lowStock={lowStock} orders={orders} setPage={setPage} />}
        {['Inventory Items', 'Ingredient Management', 'Stock Levels', 'Low-Stock / Reorder Alerts'].includes(page) && <InventoryList page={page} items={pageItems} allItems={items} query={query} setQuery={setQuery} typeFilter={typeFilter} setTypeFilter={setTypeFilter} canManageInventory={canManageInventory} onAdd={() => { setSelectedItem(null); setModal('item'); }} onEdit={(item) => { setSelectedItem(item); setModal('item'); }} onAdjust={(item) => { setSelectedItem(item); setModal('adjustment'); }} />}
        {page === 'Stock Movement / Adjustments' && <Movements items={items} movements={movements} onAdjust={(item) => { setSelectedItem(item); setModal('adjustment'); }} />}
        {page === 'Supplier Management' && canManageInventory && <Suppliers suppliers={suppliers} onAdd={() => setModal('supplier')} />}
        {page === 'Procurement / Purchase Orders' && canManageInventory && <PurchaseOrders orders={orders} onCreate={() => setModal('purchase')} onReceive={receiveOrder} />}
        {page === 'Inventory Reports' && canManageInventory && <Reports items={items} lowStock={lowStock} />}
      </div><footer className="footer"><span>VikingsERP <b>·</b> Inventory & Procurement</span><span className="connection"><i /> {apiStatus}</span></footer>
    </main>
    {modal && <Modal type={modal} item={selectedItem} items={items} suppliers={suppliers} onClose={() => setModal('')} onSave={saveItem} onAdjust={recordAdjustment} onCreateOrder={createPurchaseOrder} onCreateSupplier={createSupplier} />}
    {accountOpen && <AccountDialog user={user} onLogout={onLogout} onClose={() => setAccountOpen(false)} />}
  </div>;
}

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function AccountDialog({ user, onLogout, onClose }) {
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'U';
  return <div className="profile-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="profile-dialog"><div className="profile-dialog-heading"><span className="profile-dialog-mark">{initials}</span><div><small>{user.demo ? 'TEMPORARY DEMO' : 'VIKINGSERP ACCOUNT'}</small><h2>{user.name}</h2></div><button type="button" onClick={onClose} aria-label="Close account menu">×</button></div><div className="account-details"><span>EMAIL ADDRESS<b>{user.email}</b></span><span>ACCOUNT ROLE<b>{user.demo ? 'Demo mode' : user.role}</b></span></div>{user.demo ? <p>Demo mode uses browser-local sample data. Server-backed actions require sign-in.</p> : <p>Your account works in POS and Billing too. Sign in there with these credentials.</p>}{user.role === 'Owner' && !user.demo && <RoleManager />}<div className="profile-dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Close</button>{!user.demo && <button type="button" className="logout-button" onClick={() => { onLogout().catch(() => {}); }}>Sign out <span>↗</span></button>}</div></section></div>;
}
function RoleManager() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiFetch('/api/users')
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not load accounts.');
        if (active) setUsers(data);
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const updateRole = async (id, role) => {
    setError('');
    try {
      const response = await apiFetch(`/api/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not update account role.');
      setUsers((current) => current.map((account) => account.id === id ? { ...account, role } : account));
    } catch (requestError) {
      setError(requestError.message || 'Could not update account role.');
    }
  };

  return <div className="role-manager"><div className="role-manager-heading"><b>TEAM ACCESS</b><span>Assign Manager access to a trusted person.</span></div>{loading ? <p>Loading accounts…</p> : users.map((account) => <div className="role-manager-row" key={account.id}><span className="role-manager-account"><b>{account.name}</b><small>{account.email}</small></span><select aria-label={`Role for ${account.name}`} value={account.role} disabled={account.role === 'Owner'} onChange={(event) => updateRole(account.id, event.target.value)}>{account.role === 'Owner' && <option value="Owner">Owner</option>}<option value="Manager">Manager</option><option value="Staff">Staff</option></select></div>)}{error && <p className="role-manager-error" role="alert">{error}</p>}</div>;
}
function subtitle(page) {
  return ({
    'Inventory Dashboard': 'Real-time view of ingredients, supplies, and purchasing.',
    'Inventory Items': 'Manage stock items, units, costs, and reorder points.',
    'Ingredient Management': 'Manage ingredients consumed by menu items.',
    'Stock Levels': 'Review current on-hand quantities across your inventory.',
    'Stock Movement / Adjustments': 'Record and review incoming, consumed, and adjusted stock.',
    'Supplier Management': 'Maintain supplier contacts and sourcing information.',
    'Procurement / Purchase Orders': 'Create purchase orders and record deliveries.',
    'Low-Stock / Reorder Alerts': 'Items at or below their configured reorder points.',
    'Inventory Reports': 'Review stock value and replenishment needs.',
  })[page] || '';
}
function Dashboard({ items, lowStock, orders, setPage }) {
  const value = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.cost), 0);
  return <>
    <section className="restaurant-hero inventory-hero">
      <div className="hero-copy"><span className="hero-kicker"><i /> KITCHEN OPERATIONS · ROXAS</span><h2>Well-stocked kitchen.<br /><em>Seamless service.</em></h2><p>Keep ingredients fresh, supplies ready, and every delivery accounted for.</p><div className="hero-actions"><button className="hero-cta" onClick={() => setPage('Procurement / Purchase Orders')}>＋ Create purchase order <span>→</span></button><button className="hero-secondary" onClick={() => setPage('Stock Movement / Adjustments')}>Record stock movement</button></div></div>
      <div className="stockroom-art" aria-hidden="true"><div className="stockroom-shelf shelf-top"><span /><span /><span /></div><div className="stockroom-shelf shelf-mid"><span /><span /><span /><span /></div><div className="stockroom-shelf shelf-bottom"><span /><span /><span /></div><div className="stockroom-tag"><b>{lowStock.length.toString().padStart(2, '0')}</b><span>NEED<br />ATTENTION</span></div><i className="stockroom-spark">✦</i></div>
      <div className="hero-foot"><span><b>01</b> RECEIVE</span><i /><span><b>02</b> CHECK STOCK</span><i /><span><b>03</b> REPLENISH</span></div>
    </section>
    <div className="metric-grid"><Metric label="Active stock items" value={items.length.toString()} note="Ingredients and supplies" glyph="IT" /><Metric label="Inventory value" value={money(value)} note="Estimated at recorded unit cost" glyph="₱" /><Metric label="Low-stock alerts" value={lowStock.length.toString()} note="At or below reorder point" glyph="AL" /><Metric label="Open purchase orders" value={orders.filter((order) => order.status === 'Pending').length.toString()} note="Awaiting delivery" glyph="PO" /></div>
    <div className="dashboard-grid"><section className="surface stock-overview"><div className="surface-head"><div><h2>Stock health</h2><p>Current inventory by reorder status</p></div><button className="text-link" onClick={() => setPage('Stock Levels')}>View stock levels →</button></div><div className="health-summary"><div><span className="health-number">{items.length - lowStock.length}</span><span>In stock</span></div><div><span className="health-number alert-number">{lowStock.length}</span><span>Needs reorder</span></div></div><div className="health-bar"><i style={{ width: `${items.length ? (items.length - lowStock.length) / items.length * 100 : 0}%` }} /></div><div className="health-labels"><span>Healthy stock</span><span>{items.length ? Math.round((items.length - lowStock.length) / items.length * 100) : 0}%</span></div><div className="mini-list">{lowStock.slice(0, 3).map((item) => <div key={item.id}><span className="mini-indicator" /><strong>{item.name}</strong><small>{number(item.quantity)} {item.unit} left</small><b>Reorder {number(item.reorder)}</b></div>)}{lowStock.length === 0 && <p className="no-alerts">All stock items are above their reorder points.</p>}</div></section>
      <section className="surface quick-actions"><div className="surface-head"><div><h2>Inventory actions</h2><p>Common stockroom tasks</p></div></div><button onClick={() => setPage('Inventory Items')}><span className="action-icon">＋</span><span><b>Manage inventory items</b><small>Add, update, or adjust stock</small></span><i>→</i></button><button onClick={() => setPage('Procurement / Purchase Orders')}><span className="action-icon">↗</span><span><b>Create purchase order</b><small>Request supplies from a vendor</small></span><i>→</i></button><button onClick={() => setPage('Inventory Reports')}><span className="action-icon">▤</span><span><b>Review inventory report</b><small>View stock value and alerts</small></span><i>→</i></button></section></div>
    <section className="surface dashboard-table"><div className="surface-head"><div><h2>Reorder attention</h2><p>Items closest to or below minimum stock</p></div><button className="text-link" onClick={() => setPage('Low-Stock / Reorder Alerts')}>View all alerts →</button></div><StockTable items={lowStock.slice(0, 5)} onAdjust={() => setPage('Procurement / Purchase Orders')} /></section>
  </>;
}
function Metric({ label, value, note, glyph }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><i>{glyph}</i></div><strong>{value}</strong><small><span className="metric-neutral">—</span> {note}</small></article>;
}
function InventoryList({ page, items, allItems, query, setQuery, typeFilter, setTypeFilter, canManageInventory, onAdd, onEdit, onAdjust }) {
  const showingStock = page === 'Stock Levels';
  const showingAlerts = page === 'Low-Stock / Reorder Alerts';
  const ingredientCount = allItems.filter((item) => item.type === 'Ingredient').length;
  const supplyCount = allItems.filter((item) => item.type === 'Supply').length;
  const lowCount = allItems.filter((item) => Number(item.quantity) <= Number(item.reorder)).length;
  const pageGuide = {
    'Inventory Items': {
      className: 'catalog',
      icon: 'IT',
      label: 'ITEM CATALOG',
      title: 'Manage everything you keep in stock.',
      description: 'Add or edit ingredients and operating supplies, then set their units, suppliers, and reorder points.',
      stats: [['All items', allItems.length], ['Ingredients', ingredientCount], ['Supplies', supplyCount]],
    },
    'Ingredient Management': {
      className: 'ingredients',
      icon: 'IG',
      label: 'KITCHEN INGREDIENTS',
      title: 'Focus on the ingredients used in the kitchen.',
      description: 'This list only includes items marked as ingredients. Use it to maintain ingredient details and monitor what needs replenishing.',
      stats: [['Ingredients', ingredientCount], ['Need reorder', allItems.filter((item) => item.type === 'Ingredient' && Number(item.quantity) <= Number(item.reorder)).length]],
    },
    'Stock Levels': {
      className: 'stock-levels',
      icon: 'SL',
      label: 'CURRENT STOCK SNAPSHOT',
      title: 'See what is on hand right now.',
      description: 'Compare each current quantity with its reorder point. Receive deliveries or record corrections in Stock Movement / Adjustments.',
      stats: [['At reorder point', lowCount], ['Above reorder point', allItems.length - lowCount], ['Items tracked', allItems.length]],
    },
    'Low-Stock / Reorder Alerts': {
      className: 'reorder-alerts',
      icon: 'AL',
      label: 'REPLENISHMENT NEEDED',
      title: 'These items have reached their reorder point.',
      description: 'Review the list and create a purchase order from Procurement / Purchase Orders to replenish stock.',
      stats: [['Items to review', lowCount]],
    },
  }[page];
  const isIngredientPage = page === 'Ingredient Management';
  return <>
    {pageGuide && <PageGuide guide={pageGuide} />}
    <section className={`surface table-surface inventory-list ${showingStock ? 'stock-level-list' : ''}`}>
      <div className="table-toolbar"><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search item, SKU, or category..." /></label>{page === 'Inventory Items' && <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All</option><option>Ingredient</option><option>Supply</option></select>}<span className="result-count">{items.length} {showingStock ? 'ITEMS' : 'RECORDS'}</span>{canManageInventory && !showingStock && !showingAlerts && <button className="primary-button" onClick={onAdd}>＋ New {isIngredientPage ? 'ingredient' : 'item'}</button>}</div>
      <div className="list-context">{showingAlerts ? <span className="alert-context">Only items at or below their reorder level are shown</span> : showingStock ? <span>Quantities update when deliveries are received or stock movements are recorded.</span> : isIngredientPage ? <span>Filtered to items whose type is Ingredient.</span> : <span>Complete catalog of ingredients and operating supplies.</span>}</div>
      <StockTable items={items} onEdit={canManageInventory ? onEdit : undefined} onAdjust={onAdjust} showCost={canManageInventory && !showingAlerts} showStockCoverage={showingStock} />
      <div className="table-footer">Showing {items.length} of {allItems.length} items {canManageInventory && <span>Unit costs are for inventory reference.</span>}</div>
    </section>
  </>;
}
function PageGuide({ guide }) {
  return <section className={`page-guide ${guide.className}`}><div className="page-guide-main"><span className="page-guide-icon">{guide.icon}</span><div><span className="page-guide-label">{guide.label}</span><h2>{guide.title}</h2><p>{guide.description}</p></div></div><div className="page-guide-stats">{guide.stats.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section>;
}
function StockTable({ items, onEdit, onAdjust, showCost = true, showStockCoverage = false }) {
  return <div className="table-wrap"><table><thead><tr><th>ITEM / SKU</th><th>CATEGORY</th><th>{showStockCoverage ? 'CURRENT ON HAND' : 'ON HAND'}</th>{showStockCoverage && <th>REORDER COVERAGE</th>}<th>REORDER LEVEL</th>{showCost && <th>UNIT COST</th>}<th>STATUS</th>{(onEdit || onAdjust) && <th className="align-right">ACTIONS</th>}</tr></thead><tbody>{items.map((item) => {
    const low = Number(item.quantity) <= Number(item.reorder);
    const coverage = Number(item.reorder) > 0 ? Math.min(Number(item.quantity) / Number(item.reorder) * 100, 100) : 100;
    return <tr key={item.id}><td><strong>{item.name}</strong><small className="table-subtext">{item.sku} · {item.type}</small></td><td>{item.category}</td><td><strong>{number(item.quantity)} {item.unit}</strong></td>{showStockCoverage && <td><div className={`stock-coverage ${low ? 'low' : ''}`}><span><i style={{ width: `${coverage}%` }} /></span><small>{low ? `${Math.round(coverage)}% of reorder point` : 'Above reorder point'}</small></div></td>}<td>{number(item.reorder)} {item.unit}</td>{showCost && <td>{money(item.cost)}</td>}<td><span className={`stock-status ${low ? 'low' : ''}`}><i />{low ? 'Reorder' : 'In stock'}</span></td>{(onEdit || onAdjust) && <td className="align-right action-cell">{onAdjust && <button onClick={() => onAdjust(item)}>Adjust</button>}{onEdit && <button onClick={() => onEdit(item)}>Edit</button>}</td>}</tr>;
  })}</tbody></table>{items.length === 0 && <div className="empty-state">No items match your search.</div>}</div>;
}
function Movements({ items, movements, onAdjust }) {
  const [query, setQuery] = useState('');
  const matched = items.filter((item) => `${item.name} ${item.sku}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageGuide guide={{ className: 'movements', icon: '↕', label: 'STOCK CHANGE LOG', title: 'Record a change or review its history.', description: 'Use Adjust to add, deduct, or correct a quantity. Every saved change includes a reason and appears in the movement history.', stats: [['Recorded movements', movements.length], ['Items available', items.length]] }} /><div className="movement-layout"><section className="surface table-surface movement-entry"><div className="surface-head"><div><h2>Make a stock adjustment</h2><p>Choose an item, then record the quantity change and reason.</p></div></div><div className="table-toolbar"><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an inventory item..." /></label></div><StockTable items={matched} onAdjust={onAdjust} showCost={false} /></section><section className="surface table-surface movement-history"><div className="surface-head movement-history-head"><div><h2>Movement history</h2><p>Audit trail of additions, deductions, and corrections</p></div><span className="result-count">{movements.length} RECORDS</span></div><div className="table-wrap"><table><thead><tr><th>DATE & TIME</th><th>ITEM / SKU</th><th>MOVEMENT</th><th>QUANTITY CHANGE</th><th>REASON / REFERENCE</th></tr></thead><tbody>{movements.map((movement) => <tr key={movement.id}><td>{new Date(movement.date).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td><strong>{movement.itemName}</strong><small className="table-subtext">{movement.sku}</small></td><td>{movement.type}</td><td><strong>{Number(movement.quantity) > 0 ? '+' : ''}{number(movement.quantity)} {movement.unit}</strong></td><td>{movement.reason}{movement.referenceNo ? ` · ${movement.referenceNo}` : ''}</td></tr>)}</tbody></table>{movements.length === 0 && <div className="empty-state">No movements recorded yet. Use Adjust above to create the first movement.</div>}</div></section></div></>;
}
function Suppliers({ suppliers, onAdd }) {
  return <section className="surface table-surface"><div className="surface-head suppliers-heading"><div><h2>Supplier directory</h2><p>Approved vendor contact details and supply categories</p></div><button className="primary-button" onClick={onAdd}>＋ Add supplier</button></div><div className="supplier-grid">{suppliers.map((supplier) => <article className="supplier-card" key={supplier.id}><div className="supplier-top"><span className="supplier-avatar">{supplier.name.split(' ').slice(0, 2).map((word) => word[0]).join('')}</span><span className="supplier-status">{supplier.status}</span></div><h3>{supplier.name}</h3><p>{supplier.items}</p><div className="supplier-details"><span>PHONE <b>{supplier.contact}</b></span><span>EMAIL <b>{supplier.email}</b></span></div><button className="text-link" onClick={() => window.location.href = `mailto:${supplier.email}`}>Contact supplier →</button></article>)}</div></section>;
}
function PurchaseOrders({ orders, onCreate, onReceive }) {
  return <section className="surface table-surface"><div className="surface-head"><div><h2>Purchase orders</h2><p>Create replenishment orders and receive deliveries into stock.</p></div><button className="primary-button" onClick={onCreate}>＋ New purchase order</button></div><div className="po-summary"><span><b>{orders.filter((order) => order.status === 'Pending').length}</b> Awaiting delivery</span><span><b>{orders.filter((order) => order.status === 'Received').length}</b> Received orders</span><span><b>{money(orders.filter((order) => order.status === 'Pending').reduce((sum, order) => sum + Number(order.amount), 0))}</b> Pending value</span></div><div className="table-wrap"><table><thead><tr><th>ORDER NO.</th><th>SUPPLIER</th><th>ORDER DATE</th><th>LINE ITEMS</th><th>EST. TOTAL</th><th>STATUS</th><th className="align-right">ACTION</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong></td><td>{order.supplier}</td><td>{new Date(`${order.date}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td><td>{order.lines}</td><td><strong>{money(order.amount)}</strong></td><td><span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span></td><td className="align-right">{order.status === 'Pending' ? <button className="receive-button" onClick={() => onReceive(order)}>Receive stock</button> : <span className="received-check">✓ Received</span>}</td></tr>)}</tbody></table>{orders.length === 0 && <div className="empty-state">No purchase orders recorded.</div>}</div></section>;
}
function Reports({ items, lowStock }) {
  const value = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.cost), 0);
  const byCategory = [...new Set(items.map((item) => item.category))].map((category) => {
    const valueForCategory = items.filter((item) => item.category === category).reduce((sum, item) => sum + Number(item.quantity) * Number(item.cost), 0);
    return { category, value: valueForCategory };
  }).sort((a, b) => b.value - a.value);
  const max = Math.max(...byCategory.map((row) => row.value), 1);
  const generatedAt = new Date();
  const itemValue = (item) => Number(item.quantity) * Number(item.cost);
  return <section className="inventory-report">
    <header className="report-heading">
      <div className="report-brand"><span>V</span><div><strong>VIKINGS GRILL <i>ERP</i></strong><small>ROXAS BRANCH · INVENTORY & PROCUREMENT</small></div></div>
      <div className="report-heading-meta"><span>INTERNAL OPERATIONS REPORT</span><strong>{generatedAt.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</strong><small>Generated {generatedAt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</small></div>
    </header>
    <div className="report-title-row"><div><span className="report-eyebrow">STOCK SUMMARY</span><h2>Inventory Report</h2><p>On-hand quantities, reorder points, and estimated stock value.</p></div><button className="secondary-button report-print-button" onClick={() => window.print()}>Print report</button></div>
    <div className="report-summary-grid">
      <article><span>ESTIMATED STOCK VALUE</span><strong>{money(value)}</strong><small>Current quantity × unit cost</small></article>
      <article><span>ACTIVE INVENTORY ITEMS</span><strong>{items.length}</strong><small>Ingredients and operating supplies</small></article>
      <article className={lowStock.length ? 'report-summary-alert' : ''}><span>AT OR BELOW REORDER</span><strong>{lowStock.length}</strong><small>Items requiring replenishment</small></article>
      <article><span>INVENTORY CATEGORIES</span><strong>{byCategory.length}</strong><small>Categories represented in stock</small></article>
    </div>
    <div className="reports-grid">
      <section className="surface category-report"><div className="surface-head"><div><h2>Inventory value by category</h2><p>Estimated value at current on-hand levels</p></div></div>{byCategory.map((row) => <div className="category-bar-row" key={row.category}><div><span>{row.category}</span><b>{money(row.value)}</b></div><div className="category-bar"><i style={{ width: `${row.value / max * 100}%` }} /></div></div>)}{byCategory.length === 0 && <div className="no-alerts">No inventory categories to report.</div>}</section>
      <section className="surface report-alerts"><div className="surface-head"><div><h2>Reorder summary</h2><p>Items at or below reorder level</p></div><strong className="report-alert-count">{lowStock.length}</strong></div>{lowStock.map((item) => <div className="report-alert-row" key={item.id}><span>{item.name}<small>{item.sku}</small></span><b>{number(item.quantity)} {item.unit}</b></div>)}{lowStock.length === 0 && <div className="no-alerts">No items currently need replenishment.</div>}</section>
    </div>
    <section className="surface report-inventory-table">
      <div className="surface-head"><div><h2>Inventory detail</h2><p>Item-level stock position and estimated value</p></div><span className="result-count">{items.length} ITEMS</span></div>
      <div className="table-wrap"><table><thead><tr><th>ITEM / SKU</th><th>CATEGORY</th><th>TYPE</th><th>ON HAND</th><th>REORDER LEVEL</th><th>UNIT COST</th><th>STOCK VALUE</th><th>STATUS</th></tr></thead><tbody>{items.map((item) => {
        const low = Number(item.quantity) <= Number(item.reorder);
        return <tr key={item.id}><td><strong>{item.name}</strong><small className="table-subtext">{item.sku}</small></td><td>{item.category}</td><td>{item.type}</td><td>{number(item.quantity)} {item.unit}</td><td>{number(item.reorder)} {item.unit}</td><td>{money(item.cost)}</td><td><strong>{money(itemValue(item))}</strong></td><td><span className={`stock-status ${low ? 'low' : ''}`}><i />{low ? 'Reorder' : 'In stock'}</span></td></tr>;
      })}</tbody><tfoot><tr><th colSpan="6">TOTAL ESTIMATED INVENTORY VALUE</th><th>{money(value)}</th><th /></tr></tfoot></table>{items.length === 0 && <div className="empty-state">No inventory items to report.</div>}</div>
    </section>
    <footer className="report-footer"><span>VikingsERP · Inventory & Procurement · Roxas Branch</span><span>For internal operations use</span></footer>
  </section>;
}
function Modal({ type, item, items, suppliers, onClose, onSave, onAdjust, onCreateOrder, onCreateSupplier }) {
  const [form, setForm] = useState(item ? { ...item } : { sku: '', name: '', category: 'Meat & poultry', unit: 'kg', quantity: '0', reorder: '0', cost: '0', supplier: '', type: 'Ingredient' });
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Stock count correction');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [itemId, setItemId] = useState(items[0]?.id || '');
  const [quantity, setQuantity] = useState('1');
  const [supplierForm, setSupplierForm] = useState({ name: '', contact: '', email: '' });
  const title = type === 'item' ? (item ? 'Edit inventory item' : 'Add inventory item') : type === 'adjustment' ? 'Record stock movement' : type === 'purchase' ? 'Create purchase order' : 'Add supplier';
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card"><div className="modal-heading"><div><span className="eyebrow">INVENTORY MANAGEMENT</span><h2>{title}</h2></div><button onClick={onClose} aria-label="Close">×</button></div>
    {type === 'item' && <form onSubmit={(event) => { event.preventDefault(); onSave(form); }}><div className="form-grid"><label>ITEM NAME<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>SKU<input required value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></label><label>TYPE<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Ingredient</option><option>Supply</option></select></label><label>CATEGORY<input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label><label>UNIT<input required value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /></label><label>ON-HAND QUANTITY<input type="number" min="0" step="0.001" required value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label><label>REORDER LEVEL<input type="number" min="0" step="0.001" required value={form.reorder} onChange={(event) => setForm({ ...form, reorder: event.target.value })} /></label><label>UNIT COST (₱)<input type="number" min="0" step="0.01" required value={form.cost} onChange={(event) => setForm({ ...form, cost: event.target.value })} /></label><label className="wide-field">SUPPLIER<select value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })}><option value="">Unassigned</option>{suppliers.map((entry) => <option key={entry.id}>{entry.name}</option>)}</select></label></div><ModalButtons onClose={onClose} submit={item ? 'Save changes' : 'Add item'} /></form>}
    {type === 'adjustment' && <form onSubmit={async (event) => { event.preventDefault(); const ok = await onAdjust(item, amount, reason); if (ok) onClose(); }}><div className="selected-item"><b>{item?.name}</b><span>Current stock: {number(item?.quantity)} {item?.unit}</span></div><label className="modal-field">QUANTITY CHANGE<input autoFocus type="number" step="0.001" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Use + for stock received, − for deductions" required /></label><label className="modal-field">REASON<select value={reason} onChange={(event) => setReason(event.target.value)}><option>Stock count correction</option><option>Delivery received</option><option>Waste / spoilage</option><option>Internal use</option><option>Other</option></select></label><p className="modal-hint">Stock cannot be adjusted to a negative quantity. Each adjustment is recorded in the movement log.</p><ModalButtons onClose={onClose} submit="Save adjustment" /></form>}
    {type === 'purchase' && <form onSubmit={(event) => { event.preventDefault(); onCreateOrder(supplierId, itemId, quantity); }}><label className="modal-field">SUPPLIER<select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>{suppliers.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><label className="modal-field">ITEM<select value={itemId} onChange={(event) => setItemId(event.target.value)}>{items.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {money(entry.cost)}/{entry.unit}</option>)}</select></label><label className="modal-field">QUANTITY TO ORDER<input type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label><p className="modal-hint">The sample order is created as Pending; confirm receipt to add this quantity to on-hand stock.</p><ModalButtons onClose={onClose} submit="Create purchase order" /></form>}
    {type === 'supplier' && <form onSubmit={(event) => { event.preventDefault(); onCreateSupplier(supplierForm); }}><label className="modal-field">SUPPLIER NAME<input required value={supplierForm.name} onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })} /></label><label className="modal-field">PHONE<input value={supplierForm.contact} onChange={(event) => setSupplierForm({ ...supplierForm, contact: event.target.value })} /></label><label className="modal-field">EMAIL<input type="email" value={supplierForm.email} onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })} /></label><ModalButtons onClose={onClose} submit="Add supplier" /></form>}
  </section></div>;
}
function ModalButtons({ onClose, submit }) {
  return <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">{submit}</button></div>;
}

export default App;
