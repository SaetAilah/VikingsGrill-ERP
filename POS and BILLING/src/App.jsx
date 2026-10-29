import React, { useEffect, useState } from 'react';
import AuthGate from './Auth.jsx';
import { apiFetch } from './auth.js';

const menuSeed = [
  { id: 1, name: 'Grilled Pork Belly', category: 'Grill', price: 289, available: true, code: 'GR-001' },
  { id: 2, name: 'Chicken Inasal', category: 'Grill', price: 249, available: true, code: 'GR-002' },
  { id: 3, name: 'Beef Kare-Kare', category: 'Main course', price: 325, available: true, code: 'MC-014' },
  { id: 4, name: 'Garlic Rice', category: 'Sides', price: 65, available: true, code: 'SD-003' },
  { id: 5, name: 'Sinigang na Baboy', category: 'Main course', price: 299, available: true, code: 'MC-009' },
  { id: 6, name: 'Halo-Halo', category: 'Dessert', price: 145, available: true, code: 'DS-002' },
  { id: 7, name: 'Iced Tea Pitcher', category: 'Drinks', price: 120, available: true, code: 'DR-005' },
  { id: 8, name: 'Lechon Kawali', category: 'Grill', price: 315, available: true, code: 'GR-006' },
];
const initialSales = [
  { id: 'VG-1048', date: new Date(Date.now() - 1000 * 60 * 22).toISOString(), table: 'Table 08', items: 5, total: 1125, method: 'Cash', status: 'Completed' },
  { id: 'VG-1047', date: new Date(Date.now() - 1000 * 60 * 56).toISOString(), table: 'Table 03', items: 3, total: 774, method: 'Card', status: 'Completed' },
  { id: 'VG-1046', date: new Date(Date.now() - 1000 * 60 * 112).toISOString(), table: 'Takeaway', items: 2, total: 434, method: 'GCash', status: 'Completed' },
];
const navItems = [
  ['POS Dashboard', 'OV'],
  ['Order Processing', 'OR'],
  ['Billing / Checkout', 'BI'],
  ['Payment Processing', 'PM'],
  ['Receipt', 'RC'],
  ['Transaction History', 'TH'],
  ['Sales Transactions', 'ST'],
];
const menuManagementNav = ['Menu Management', 'MM'];
const money = (value) => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const menuCodeSlug = (value) => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const standardMenuCategories = ['Appetizers', 'Main course', 'Grill', 'Sides', 'Dessert', 'Drinks', 'Beverages', 'Specials'];
const generateMenuCode = (name, category, menu, excludeId = null) => {
  const itemSlug = menuCodeSlug(name).slice(0, 30).replace(/-$/g, '') || 'ITEM';
  const categoryPrefix = menuCodeSlug(category).replace(/-/g, '').slice(0, 3) || 'ITM';
  const base = `${categoryPrefix}-${itemSlug}`;
  const existingCodes = new Set(menu
    .filter((item) => item.id !== excludeId)
    .map((item) => String(item.code || '').toUpperCase()));
  if (!existingCodes.has(base)) return base;
  let suffix = 2;
  while (existingCodes.has(`${base.slice(0, 37 - String(suffix).length)}-${suffix}`)) suffix += 1;
  return `${base.slice(0, 37 - String(suffix).length)}-${suffix}`;
};

function App() {
  return <AuthGate>{({ user, onLogout }) => <POSWorkspace user={user} onLogout={onLogout} />}</AuthGate>;
}

function POSWorkspace({ user, onLogout }) {
  const isOwner = user.role === 'Owner';
  const isManager = user.role === 'Manager';
  const canManageMenu = ['Owner', 'Manager', 'Staff'].includes(user.role);
  const canViewSales = user.role === 'Owner' || isManager;
  const managerPages = ['Order Processing', 'Billing / Checkout', 'Payment Processing', 'Receipt', 'Transaction History', 'Sales Transactions', 'Menu Management'];
  const staffPages = ['Order Processing', 'Billing / Checkout', 'Payment Processing', 'Receipt', 'Menu Management'];
  const posPages = isOwner
    ? [...navItems.map(([label]) => label), 'Menu Management']
    : isManager ? ['Manager Dashboard', ...managerPages] : staffPages;
  const [page, setPage] = useState(isOwner ? 'POS Dashboard' : isManager ? 'Manager Dashboard' : 'Order Processing');
  const [accountOpen, setAccountOpen] = useState(false);
  const [menu, setMenu] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vikings-pos-menu')) || menuSeed; } catch { return menuSeed; }
  });
  const [sales, setSales] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vikings-pos-sales')) || initialSales; } catch { return initialSales; }
  });
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [notice, setNotice] = useState('');
  const [apiStatus, setApiStatus] = useState(user.demo ? 'Demo mode · Browser-local data' : 'Checking API');
  const [menuNotice, setMenuNotice] = useState('');
  const [menuForm, setMenuForm] = useState(null);

  useEffect(() => {
    if (!posPages.includes(page)) setPage(posPages[0]);
  }, [user.role, page]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (user.demo) {
        setApiStatus('Demo mode · Browser-local data');
        return;
      }
      try {
        const menuResponse = await apiFetch('/api/menu');
        if (!menuResponse.ok) throw new Error('Menu API is unavailable.');
        const menuRows = await menuResponse.json();
        if (active && Array.isArray(menuRows)) {
          setMenu(menuRows);
          setApiStatus('Connected to VikingsERP');
        }
      } catch {
        if (active) setApiStatus('Demo mode · API not connected');
      }
      if (!canViewSales) return;
      try {
        const salesResponse = await apiFetch('/api/sales');
        if (!salesResponse.ok) throw new Error('Sales API is unavailable.');
        const rows = await salesResponse.json();
        if (active && Array.isArray(rows)) {
          setSales(rows.map((row) => ({
            ...row,
            id: row.receiptNumber || row.id,
            table: row.tableName || 'Walk-in',
            total: Number(row.total),
            items: Number(row.items),
          })));
        }
      } catch {
        if (active) setNotice('Could not refresh shared sales data. Check the POS API connection.');
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
  }, [canViewSales, user.demo]);
  useEffect(() => { localStorage.setItem('vikings-pos-menu', JSON.stringify(menu)); }, [menu]);
  useEffect(() => { localStorage.setItem('vikings-pos-sales', JSON.stringify(sales)); }, [sales]);
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'U';

  const categories = ['All', ...new Set(menu.map((item) => item.category))];
  const visibleMenu = menu.filter((item) =>
    (category === 'All' || item.category === category) &&
    item.name.toLowerCase().includes(query.toLowerCase()) && item.available !== false);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = 0;
  const total = subtotal + tax;
  const todaySales = sales.reduce((sum, sale) => {
    return new Date(sale.date).toDateString() === new Date().toDateString() && sale.status === 'Completed' ? sum + Number(sale.total) : sum;
  }, 0);
  const todayCount = sales.filter((sale) => new Date(sale.date).toDateString() === new Date().toDateString() && sale.status === 'Completed').length;

  const addToCart = (product) => {
    setCart((items) => {
      const found = items.find((item) => item.id === product.id);
      return found
        ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { ...product, quantity: 1 }];
    });
    setPage('Order Processing');
  };
  const changeQuantity = (id, amount) => setCart((items) => items
    .map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item)
    .filter((item) => item.quantity > 0));
  const proceedToPayment = () => {
    setAmountTendered(total.toFixed(2));
    setPage('Payment Processing');
  };
  const saveMenuItem = async (item) => {
    setMenuNotice('');
    const editing = item.id != null;
    if (apiStatus === 'Connected to VikingsERP') {
      try {
        const response = await apiFetch(editing ? `/api/menu/${item.id}` : '/api/menu', {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Menu item could not be saved.');
        const saved = { ...item, id: data.id ?? item.id, available: true };
        setMenu((current) => editing ? current.map((entry) => entry.id === item.id ? saved : entry) : [...current, saved]);
        return;
      } catch (error) {
        throw new Error(error.message || 'Could not connect to save the menu item.');
      }
    }
    const saved = { ...item, id: item.id ?? `demo-${Date.now()}`, available: item.available ?? true };
    setMenu((current) => editing ? current.map((entry) => entry.id === item.id ? saved : entry) : [...current, saved]);
    setMenuNotice('Demo mode: menu changes are saved only in this browser preview.');
  };
  const archiveMenuItem = async (item) => {
    setMenuNotice('');
    if (apiStatus === 'Connected to VikingsERP' && !String(item.id).startsWith('demo-')) {
      const response = await apiFetch(`/api/menu/${item.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Menu item could not be removed.');
    }
    setMenu((current) => current.map((entry) => entry.id === item.id ? { ...entry, available: false } : entry));
    setCart((current) => current.filter((entry) => entry.id !== item.id));
    if (apiStatus !== 'Connected to VikingsERP' || String(item.id).startsWith('demo-')) setMenuNotice('Demo mode: menu changes are saved only in this browser preview.');
  };
  const restoreMenuItem = async (item) => {
    await saveMenuItem({ ...item, available: true });
  };
  const completePayment = async () => {
    if (cart.length === 0) return setNotice('Add at least one menu item before checkout.');
    if (paymentMethod === 'Cash' && Number(amountTendered) < total) return setNotice('Amount tendered must cover the total due.');
    const sale = {
      id: `VG-${1050 + sales.length}`,
      date: new Date().toISOString(),
      table: 'Walk-in',
      items: cart.reduce((sum, item) => sum + item.quantity, 0),
      total,
      method: paymentMethod,
      status: 'Completed',
      lines: cart.map((item) => ({ ...item })),
    };
    if (apiStatus === 'Connected to VikingsERP') {
      try {
        const response = await apiFetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cart.map(({ id, quantity }) => ({ menuItemId: id, quantity })), paymentMethod, amountTendered: Number(amountTendered || total) }),
        });
        if (response.ok) {
          const saved = await response.json();
          sale.id = saved.id || sale.id;
        } else {
          const problem = await response.json().catch(() => ({}));
          setNotice(problem.error || 'Sale could not be recorded by the server. No payment was completed.');
          return;
        }
      } catch {
        setApiStatus('Demo mode · API not connected');
      }
    } else {
      setApiStatus('Demo mode · API not connected');
    }
    setSales((items) => [sale, ...items]);
    setReceipt(sale);
    setCart([]);
    setAmountTendered('');
    setPage('Receipt');
    setNotice('');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">VG</div><div><strong>VIKING GRILL</strong><small>BAR · BILLIARDS · KTV</small></div></div>
        <div className="workspace-label">WORKSPACE</div>
        <div className="location-switch"><span className="location-dot" /> Roxas Branch <span className="chevron">⌄</span></div>
        <div className="nav-label">POINT OF SALE</div>
        <nav>{[...(isManager ? [['Manager Dashboard', 'MD']] : []), ...navItems.filter(([label]) => posPages.includes(label)), ...(canManageMenu ? [menuManagementNav] : [])].map(([label, glyph]) => <button key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => setPage(label)}><span className="nav-glyph">{glyph}</span><span>{label}</span>{label === 'Order Processing' && cart.length > 0 && <b className="nav-count">{cart.length}</b>}</button>)}</nav>
        <button className="sidebar-bottom profile-trigger" onClick={() => setAccountOpen(true)} aria-label="Open account menu"><span className="user-avatar">{initials}</span><span className="user-copy"><strong>{user.name}</strong><small>{user.demo ? 'Demo mode' : user.role}</small></span><span className="more-button">⌄</span></button>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="breadcrumbs"><span>Operations</span><b>/</b><strong>{page}</strong></div><div className="top-actions"><span className="live-status"><i /> Register open</span><span className="top-divider" /><span className="current-time">{new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}</span><button className="top-avatar profile-avatar-button" onClick={() => setAccountOpen(true)} aria-label="Open account menu">{initials}</button></div></header>
        <div className="page-content">
          {page !== 'POS Dashboard' && <div className="welcome-row"><div><p className="eyebrow">VIKINGS GRILL <span>·</span> ROXAS BRANCH</p><h1>{page}</h1><p className="subtitle">{pageSubtitle(page)}</p></div><div className="date-chip"><span className="calendar-icon">▦</span>{new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div></div>}
          {apiStatus.startsWith('Demo') && <div className="api-notice"><span className="notice-dot" /> {apiStatus}. Changes are saved in this browser for preview.</div>}
          {notice && <div className="error-notice"><span>!</span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
          {menuNotice && <div className="api-notice"><span className="notice-dot" />{menuNotice}<button className="menu-notice-dismiss" onClick={() => setMenuNotice('')} aria-label="Dismiss">×</button></div>}
          {page === 'POS Dashboard' && isOwner && <Dashboard sales={sales} todaySales={todaySales} todayCount={todayCount} setPage={setPage} />}
          {page === 'Manager Dashboard' && isManager && <ManagerDashboard menu={menu} sales={sales} todayCount={todayCount} setPage={setPage} />}
          {page === 'Menu Management' && canManageMenu && <MenuManagement menu={menu} onSave={saveMenuItem} onArchive={archiveMenuItem} onRestore={restoreMenuItem} />}
          {(page === 'Order Processing' || page === 'Billing / Checkout') && <div className="pos-layout">
            <section className="menu-panel">
              <div className="section-heading menu-section-heading"><div><h2>Menu</h2><p>Sample dishes — update these to match your restaurant</p></div><div className="menu-heading-actions"><span className="item-count">{visibleMenu.length} AVAILABLE</span>{canManageMenu && <button className="primary-button menu-add-button" onClick={() => setMenuForm({ id: null, code: '', name: '', category: '', price: '' })}>＋ Add item</button>}</div></div>
              <div className="menu-controls"><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search menu..." /></label><div className="category-tabs">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'selected' : ''}>{item}</button>)}</div></div>
              <div className={`product-grid ${canManageMenu ? 'product-grid-manage' : ''}`}>{visibleMenu.map((item) => <article className="product-admin-card" key={item.id}>
                <button className="product-card" onClick={() => addToCart(item)}><span className="product-symbol">{foodGlyph(item.name, item.category)}</span><span className="product-category">{item.category}</span><strong>{item.name}</strong><span className="product-bottom"><b>{money(item.price)}</b><i>+</i></span></button>
                {canManageMenu && <div className="product-admin-actions"><button className="secondary-button" onClick={() => setMenuForm({ id: item.id, code: item.code || '', name: item.name, category: item.category, price: String(item.price) })}>Edit</button><button className="menu-remove-button" onClick={() => archiveMenuItem(item).catch((error) => setMenuNotice(error.message || 'Could not remove menu item.'))}>Remove</button></div>}
              </article>)}
                {visibleMenu.length === 0 && <div className="empty-state">No available menu items match your search.</div>}
              </div>
            </section>
            <section className="order-panel">
              <div className="section-heading"><div><h2>Current order</h2><p>Walk-in customer <button className="text-link">Change</button></p></div><button className="clear-button" onClick={() => setCart([])} disabled={!cart.length}>Clear</button></div>
              <div className="order-meta"><span className="table-icon">⌂</span><span>Walk-in / Takeaway</span><span className="order-id">NEW ORDER</span></div>
              <div className="cart-items">{cart.length ? cart.map((item) => <div className="cart-row" key={item.id}><div className="cart-item-copy"><strong>{item.name}</strong><small>{money(item.price)} each</small></div><div className="quantity-control"><button onClick={() => changeQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button></div><strong className="line-total">{money(item.price * item.quantity)}</strong></div>) : <div className="cart-empty"><div className="empty-bag">＋</div><strong>Your order is empty</strong><span>Select menu items to get started</span></div>}</div>
              <div className="order-summary"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Tax / service charge</span><b>{money(tax)}</b></div><div className="summary-total"><span>Total due</span><strong>{money(total)}</strong></div><small>Tax and service charges are not configured.</small></div>
              <button className="primary-button checkout-button" onClick={proceedToPayment} disabled={!cart.length}>Continue to payment <span>→</span></button>
            </section>
          </div>}
          {page === 'Payment Processing' && <PaymentPanel method={paymentMethod} setMethod={setPaymentMethod} amount={amountTendered} setAmount={setAmountTendered} total={total} onComplete={completePayment} hasOrder={cart.length > 0} setPage={setPage} />}
          {page === 'Receipt' && <ReceiptPanel receipt={receipt} onPrint={() => window.print()} setPage={setPage} />}
          {page === 'Transaction History' && canViewSales && <Transactions sales={sales} />}
          {page === 'Sales Transactions' && canViewSales && <SalesReport sales={sales} />}
        </div>
        <footer className="footer"><span>VikingsERP <b>·</b> Point of Sale</span><span className="connection"><i /> {apiStatus}</span></footer>
      </main>
      {page === 'Billing / Checkout' && <div className="checkout-dock"><div><small>AMOUNT DUE</small><strong>{money(total)}</strong></div><button className="secondary-button" onClick={() => setPage('Order Processing')}>Back to order</button><button className="primary-button" onClick={proceedToPayment} disabled={!cart.length}>Proceed to payment <span>→</span></button></div>}
      {menuForm && <MenuItemDialog item={menuForm} menu={menu} onClose={() => setMenuForm(null)} onSave={async (item) => { await saveMenuItem(item); setMenuForm(null); }} />}
      {accountOpen && <AccountDialog user={user} onLogout={onLogout} onClose={() => setAccountOpen(false)} />}
    </div>
  );
}

function AccountDialog({ user, onLogout, onClose }) {
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'U';
  return <div className="profile-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="profile-dialog"><div className="profile-dialog-heading"><span className="profile-dialog-mark">{initials}</span><div><small>{user.demo ? 'TEMPORARY DEMO' : 'VIKINGSERP ACCOUNT'}</small><h2>{user.name}</h2></div><button type="button" onClick={onClose} aria-label="Close account menu">×</button></div><div className="account-details"><span>EMAIL ADDRESS<b>{user.email}</b></span><span>ACCOUNT ROLE<b>{user.demo ? 'Demo mode' : user.role}</b></span></div>{user.demo ? <p>Demo mode uses browser-local sample data. Server-backed actions require sign-in.</p> : <p>Your account works in Inventory and Procurement too. Sign in there with these credentials.</p>}{user.role === 'Owner' && !user.demo && <RoleManager />}<div className="profile-dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Close</button>{!user.demo && <button type="button" className="logout-button" onClick={() => { onLogout().catch(() => {}); }}>Sign out <span>↗</span></button>}</div></section></div>;
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

function MenuManagement({ menu, onSave, onArchive, onRestore }) {
  const blankForm = { id: null, code: '', name: '', category: '', price: '' };
  const [form, setForm] = useState(blankForm);
  const [codeEdited, setCodeEdited] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const menuCategories = [...new Set([...standardMenuCategories, ...menu.map((item) => item.category).filter(Boolean)])];
  const items = menu.filter((item) => showArchived || item.available !== false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({
        ...form,
        code: form.code.trim() || null,
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
      });
      setForm(blankForm);
      setCodeEdited(false);
    } catch (saveError) {
      setError(saveError.message || 'Could not save this menu item.');
    } finally {
      setBusy(false);
    }
  };

  const setField = (field, value) => {
    if (field === 'code') {
      setCodeEdited(true);
      setForm((current) => ({ ...current, code: value }));
      return;
    }
    setForm((current) => {
      const updated = { ...current, [field]: value };
      if (!codeEdited && (field === 'name' || field === 'category')) {
        updated.code = generateMenuCode(updated.name, updated.category, menu, updated.id);
      }
      return updated;
    });
  };

  return <section className="surface menu-management">
    <div className="surface-head"><div><h2>Restaurant menu</h2><p>These starter dishes are examples. Add your actual items, prices, and categories.</p></div><span className="item-count">{menu.filter((item) => item.available !== false).length} AVAILABLE</span></div>
    <form className="menu-editor-form" onSubmit={submit}>
      <div className="menu-editor-fields">
        <label>ITEM NAME<input value={form.name} onChange={(event) => setField('name', event.target.value)} required maxLength={120} placeholder="e.g. House special platter" /></label>
        <label>CATEGORY<select value={form.category} onChange={(event) => setField('category', event.target.value)} required><option value="" disabled>Select a category</option>{menuCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <label>PRICE (₱)<input type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setField('price', event.target.value)} required /></label>
        <label>ITEM CODE (AUTO-GENERATED)<input value={form.code || ''} onChange={(event) => setField('code', event.target.value)} maxLength={40} placeholder="Enter an item name to generate a code" /></label>
      </div>
      {error && <p className="menu-editor-error" role="alert">{error}</p>}
      <div className="menu-editor-actions">
        <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Saving…' : form.id ? 'Save changes' : '＋ Add menu item'}</button>
        {form.id && <button className="secondary-button" type="button" onClick={() => { setForm(blankForm); setError(''); }}>Cancel edit</button>}
      </div>
    </form>
    <div className="menu-list-heading"><h3>{showArchived ? 'All menu items' : 'Available menu items'}</h3><button className="secondary-button" onClick={() => setShowArchived((value) => !value)}>{showArchived ? 'Hide unavailable' : 'Show unavailable'}</button></div>
    <div className="menu-admin-list">{items.map((item) => <article className={`menu-admin-row ${item.available === false ? 'is-unavailable' : ''}`} key={item.id}>
      <span className="menu-admin-icon">{foodGlyph(item.name, item.category)}</span>
      <span className="menu-admin-copy"><b>{item.name}</b><small>{item.category}{item.code ? ` · ${item.code}` : ''}</small></span>
      <strong>{money(item.price)}</strong>
      {item.available === false
        ? <button type="button" className="secondary-button" onClick={() => onRestore(item).catch((restoreError) => setError(restoreError.message))}>Restore</button>
        : <><button type="button" className="secondary-button" onClick={() => { setForm({ id: item.id, code: item.code || '', name: item.name, category: item.category, price: String(item.price) }); setCodeEdited(Boolean(item.code)); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button><button type="button" className="menu-remove-button" onClick={() => onArchive(item).catch((archiveError) => setError(archiveError.message))}>Remove</button></>}
    </article>)}
    {!items.length && <div className="empty-state">No menu items here yet. Add your first item above.</div>}</div>
    <p className="menu-admin-note">Remove makes an item unavailable for new orders while preserving past sales and receipts.</p>
  </section>;
}

function MenuItemDialog({ item, menu, onSave, onClose }) {
  const [form, setForm] = useState(item);
  const [codeEdited, setCodeEdited] = useState(Boolean(item.code));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const menuCategories = [...new Set([...standardMenuCategories, ...menu.map((menuItem) => menuItem.category).filter(Boolean)])];
  const setField = (field, value) => {
    if (field === 'code') {
      setCodeEdited(true);
      setForm((current) => ({ ...current, code: value }));
      return;
    }
    setForm((current) => {
      const updated = { ...current, [field]: value };
      if (!codeEdited && (field === 'name' || field === 'category')) {
        updated.code = generateMenuCode(updated.name, updated.category, menu, updated.id);
      }
      return updated;
    });
  };
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({ ...form, code: form.code.trim() || null, name: form.name.trim(), category: form.category.trim(), price: Number(form.price) });
    } catch (saveError) {
      setError(saveError.message || 'Could not save this menu item.');
    } finally {
      setBusy(false);
    }
  };
  return <div className="profile-overlay menu-item-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="profile-dialog menu-item-dialog">
    <div className="profile-dialog-heading"><div><small>RESTAURANT MENU</small><h2>{form.id ? 'Edit menu item' : 'Add menu item'}</h2></div><button type="button" onClick={onClose} aria-label="Close menu editor">×</button></div>
    <form onSubmit={submit}>
      <div className="menu-editor-fields">
        <label>ITEM NAME<input value={form.name} onChange={(event) => setField('name', event.target.value)} required maxLength={120} placeholder="e.g. House special platter" /></label>
        <label>CATEGORY<select value={form.category} onChange={(event) => setField('category', event.target.value)} required><option value="" disabled>Select a category</option>{menuCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <label>PRICE (₱)<input type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setField('price', event.target.value)} required /></label>
        <label>ITEM CODE (AUTO-GENERATED)<input value={form.code || ''} onChange={(event) => setField('code', event.target.value)} maxLength={40} placeholder="Enter an item name to generate a code" /></label>
      </div>
      {error && <p className="menu-editor-error" role="alert">{error}</p>}
      <div className="menu-editor-actions"><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Saving…' : form.id ? 'Save changes' : '＋ Add item'}</button><button className="secondary-button" type="button" onClick={onClose}>Cancel</button></div>
    </form>
  </section></div>;
}

function pageSubtitle(page) {
  return ({
    'Manager Dashboard': 'Coordinate restaurant service, menu availability, and recent transactions.',
    'Order Processing': 'Build and review the customer order before billing.',
    'Billing / Checkout': 'Confirm order totals before collecting payment.',
    'Payment Processing': 'Record the customer payment securely.',
    Receipt: 'Transaction details and customer copy.',
    'Transaction History': 'Search and review completed POS transactions.',
    'Sales Transactions': 'Sales overview for accounting and management.',
    'Menu Management': 'Update sample dishes, categories, and prices for your restaurant.',
  })[page] || '';
}

function ManagerDashboard({ menu, sales, todayCount, setPage }) {
  const availableItems = menu.filter((item) => item.available !== false).length;
  const recent = sales.slice(0, 5);
  return <>
    <section className="restaurant-hero pos-hero">
      <div className="hero-copy"><span className="hero-kicker"><i /> MANAGER WORKSPACE · ROXAS</span><h2>Keep service<br /><em>running smoothly.</em></h2><p>Review today’s operations, maintain the restaurant menu, and support the team on shift.</p><div className="hero-actions"><button className="hero-cta" onClick={() => setPage('Menu Management')}>Manage restaurant menu <span>→</span></button><span className="hero-caption">MANAGER ACCESS <b>·</b> SERVICE & MENU</span></div></div>
      <div className="hero-art" aria-hidden="true"><div className="hero-plate"><span>V</span></div><i className="hero-spark spark-one">✦</i><i className="hero-spark spark-two">✦</i><span className="hero-art-label">VIKINGS<br />GRILL</span><span className="hero-art-ring" /></div>
      <div className="hero-foot"><span><b>01</b> SUPPORT SERVICE</span><i /><span><b>02</b> MAINTAIN MENU</span><i /><span><b>03</b> REVIEW ORDERS</span></div>
    </section>
    <div className="metric-grid">
      <Metric label="Orders today" value={todayCount.toString()} change="Completed POS orders" glyph="OR" />
      <Metric label="Available menu items" value={availableItems.toString()} change="Items currently offered" glyph="MN" />
      <Metric label="Recent transactions" value={sales.length.toString()} change="Transactions in history" glyph="TH" />
      <Metric label="Menu status" value="Active" change="Ready for order processing" glyph="OK" />
    </div>
    <div className="dashboard-grid">
      <section className="surface quick-actions"><div className="surface-head"><div><h2>Manager actions</h2><p>Tools for keeping restaurant service ready</p></div></div>
        <button onClick={() => setPage('Menu Management')}><span className="action-icon">＋</span><span><b>Update the menu</b><small>Add dishes, adjust prices, or remove unavailable items</small></span><i>→</i></button>
        <button onClick={() => setPage('Order Processing')}><span className="action-icon">OR</span><span><b>Open order processing</b><small>Review the ordering and checkout workspace</small></span><i>→</i></button>
        <button onClick={() => setPage('Transaction History')}><span className="action-icon">↗</span><span><b>Review transactions</b><small>Check recent completed POS activity</small></span><i>→</i></button>
      </section>
      <section className="surface recent-transactions"><div className="surface-head"><div><h2>Recent transactions</h2><p>Latest recorded orders</p></div><button className="text-link" onClick={() => setPage('Transaction History')}>View history →</button></div><TransactionTable sales={recent} /></section>
    </div>
  </>;
}

function Dashboard({ sales, todaySales, todayCount, setPage }) {
  const recent = sales.slice(0, 4);
  const bars = [34, 52, 43, 72, 48, 66, 88, 58, 75, 47, 81, 62];
  return <>
    <section className="restaurant-hero pos-hero">
      <div className="hero-copy"><span className="hero-kicker"><i /> FRONT OF HOUSE · ROXAS</span><h2>Every great meal<br /><em>starts with great service.</em></h2><p>Take orders, settle bills, and keep today's service moving from one place.</p><div className="hero-actions"><button className="hero-cta" onClick={() => setPage('Order Processing')}>＋ Start a new order <span>→</span></button><span className="hero-caption">POS REGISTER <b>·</b> READY FOR SERVICE</span></div></div>
      <div className="hero-art" aria-hidden="true"><div className="hero-plate"><span>V</span></div><i className="hero-spark spark-one">✦</i><i className="hero-spark spark-two">✦</i><span className="hero-art-label">VIKINGS<br />GRILL</span><span className="hero-art-ring" /></div>
      <div className="hero-foot"><span><b>01</b> TAKE ORDERS</span><i /><span><b>02</b> SERVE GUESTS</span><i /><span><b>03</b> CLOSE THE BILL</span></div>
    </section>
    <div className="metric-grid">
      <Metric label="Today's sales" value={money(todaySales)} change="Sales recorded today" glyph="₱" />
      <Metric label="Completed orders" value={todayCount.toString()} change="Since register opened" glyph="OR" />
      <Metric label="Average order value" value={money(todayCount ? todaySales / todayCount : 0)} change="Based on today's sales" glyph="AV" />
      <Metric label="Open order" value="1" change="Current register session" glyph="OP" />
    </div>
    <div className="dashboard-grid">
      <section className="surface sales-chart"><div className="surface-head"><div><h2>Sales overview</h2><p>Today's transaction activity</p></div><span className="period-badge">TODAY <span>⌄</span></span></div><div className="chart-total">{money(todaySales)}<span> net sales</span></div><div className="bar-chart">{bars.map((height, index) => <div className="bar-col" key={index}><div className="bar-track"><i style={{ height: `${height}%` }} /></div><small>{['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p'][index]}</small></div>)}</div><div className="chart-legend"><i /> Sales captured in POS <span>·</span> Illustrative hourly distribution</div></section>
      <section className="surface quick-actions"><div className="surface-head"><div><h2>Quick actions</h2><p>Common cashier tasks</p></div></div><button onClick={() => setPage('Order Processing')}><span className="action-icon">＋</span><span><b>Start new order</b><small>Open the menu and add items</small></span><i>→</i></button><button onClick={() => setPage('Transaction History')}><span className="action-icon">↗</span><span><b>Find a transaction</b><small>View a previous receipt</small></span><i>→</i></button><button onClick={() => setPage('Sales Transactions')}><span className="action-icon">▤</span><span><b>View sales report</b><small>Review recorded sales</small></span><i>→</i></button></section>
    </div>
    <section className="surface recent-transactions"><div className="surface-head"><div><h2>Recent transactions</h2><p>Latest completed sales at this register</p></div><button className="text-link" onClick={() => setPage('Transaction History')}>View all transactions →</button></div><TransactionTable sales={recent} /></section>
  </>;
}
function Metric({ label, value, change, glyph }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><i>{glyph}</i></div><strong>{value}</strong><small><span className="metric-neutral">—</span> {change}</small></article>;
}
function PaymentPanel({ method, setMethod, amount, setAmount, total, onComplete, hasOrder, setPage }) {
  return <div className="payment-layout"><section className="surface payment-form"><div className="surface-head"><div><h2>Payment details</h2><p>Choose a payment method and enter the amount received.</p></div></div><label className="field-label">PAYMENT METHOD</label><div className="payment-methods">{['Cash', 'Card', 'GCash', 'Maya'].map((item) => <button key={item} className={method === item ? 'method-selected' : ''} onClick={() => setMethod(item)}><span className="method-icon">{item === 'Cash' ? '₱' : item === 'Card' ? '▤' : 'G'}</span>{item}{method === item && <b>✓</b>}</button>)}</div>{method === 'Cash' && <label className="form-field"><span>AMOUNT TENDERED</span><div className="input-currency"><b>₱</b><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></div></label>}<div className="payment-note">Payment is recorded as a staff-entered transaction. No external payment gateway is connected.</div><button className="primary-button full-button" onClick={onComplete} disabled={!hasOrder}>Complete payment <span>→</span></button></section><section className="surface payment-summary"><span className="field-label">ORDER SUMMARY</span><div className="payment-amount">{money(total)}<small>Amount due</small></div><div className="summary-divider" /><div className="summary-line"><span>Subtotal</span><b>{money(total)}</b></div><div className="summary-line"><span>Tax / service charge</span><b>{money(0)}</b></div>{method === 'Cash' && <div className="summary-line"><span>Change</span><b>{money(Math.max(0, Number(amount || 0) - total))}</b></div>}<button className="back-link" onClick={() => setPage('Order Processing')}>← Return to order</button></section></div>;
}
function ReceiptPanel({ receipt, onPrint, setPage }) {
  if (!receipt) return <section className="surface empty-receipt"><span className="receipt-icon">RC</span><h2>No receipt to display</h2><p>Complete a payment to generate a customer receipt.</p><button className="primary-button" onClick={() => setPage('Order Processing')}>Start an order</button></section>;
  return <div className="receipt-layout"><section className="surface receipt-card"><div className="receipt-brand">VIKINGS GRILL<small>ROXAS BRANCH</small></div><div className="receipt-separator" /><div className="receipt-title"><b>SALES RECEIPT</b><span>{receipt.id}</span></div><div className="receipt-info"><span>Date <b>{new Date(receipt.date).toLocaleString()}</b></span><span>Order type <b>{receipt.table || 'Walk-in'}</b></span><span>Payment <b>{receipt.method}</b></span></div><div className="receipt-separator" /><div className="receipt-lines">{(receipt.lines || []).map((line) => <div key={line.id}><span>{line.quantity} × {line.name}</span><b>{money(line.price * line.quantity)}</b></div>)}</div><div className="receipt-separator" /><div className="receipt-total"><span>Total paid</span><strong>{money(receipt.total)}</strong></div><p className="receipt-thanks">Thank you for dining with us.</p></section><section className="receipt-actions"><div className="surface"><h2>Receipt ready</h2><p>Transaction <b>{receipt.id}</b> has been recorded. Print or review the transaction.</p><button className="primary-button full-button" onClick={onPrint}>Print customer receipt <span>↗</span></button><button className="secondary-button full-button" onClick={() => setPage('Transaction History')}>View transaction history</button><button className="back-link" onClick={() => setPage('Order Processing')}>＋ Start another order</button></div></section></div>;
}
function Transactions({ sales }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All transactions');
  const filtered = sales.filter((sale) => sale.id.toLowerCase().includes(query.toLowerCase()) || (sale.table || '').toLowerCase().includes(query.toLowerCase()))
    .filter((sale) => filter === 'All transactions' || sale.status === filter);
  return <section className="surface table-surface"><div className="table-toolbar"><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search receipt or order..." /></label><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All transactions</option><option>Completed</option><option>Voided</option></select><button className="secondary-button" onClick={() => window.print()}>Export / Print</button></div><TransactionTable sales={filtered} /></section>;
}
function SalesReport({ sales }) {
  const completed = sales.filter((sale) => sale.status === 'Completed');
  const gross = completed.reduce((sum, sale) => sum + Number(sale.total), 0);
  const cash = completed.filter((sale) => sale.method === 'Cash').reduce((sum, sale) => sum + Number(sale.total), 0);
  const digital = gross - cash;
  return <><div className="metric-grid report-metrics"><Metric label="Recorded sales" value={money(gross)} change="All completed transactions" glyph="₱" /><Metric label="Transactions" value={completed.length.toString()} change="Completed sales records" glyph="TX" /><Metric label="Cash payments" value={money(cash)} change="Cashier recorded" glyph="CA" /><Metric label="Non-cash payments" value={money(digital)} change="Card and e-wallet entries" glyph="NC" /></div><section className="surface table-surface"><div className="surface-head"><div><h2>Sales transactions</h2><p>Recorded sales for accounting and management review</p></div><button className="secondary-button" onClick={() => window.print()}>Print report</button></div><TransactionTable sales={sales} /></section></>;
}
function TransactionTable({ sales }) {
  return <div className="table-wrap"><table><thead><tr><th>RECEIPT NO.</th><th>DATE & TIME</th><th>ORDER / TABLE</th><th>ITEMS</th><th>PAYMENT</th><th>STATUS</th><th className="align-right">TOTAL</th></tr></thead><tbody>{sales.map((sale) => <tr key={sale.id}><td><strong className="receipt-number">{sale.id}</strong></td><td>{new Date(sale.date).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td>{sale.table || 'Walk-in'}</td><td>{sale.items}</td><td><span className="payment-pill">{sale.method}</span></td><td><span className={`status-pill ${sale.status === 'Completed' ? 'completed' : ''}`}>{sale.status}</span></td><td className="align-right"><strong>{money(sale.total)}</strong></td></tr>)}</tbody></table>{sales.length === 0 && <div className="empty-state">No transactions found.</div>}</div>;
}

function foodGlyph(name, category) {
  const dish = name.toLowerCase();
  if (dish.includes('halo')) return '🍧';
  if (dish.includes('rice')) return '🍚';
  if (dish.includes('tea')) return '🧋';
  if (dish.includes('chicken')) return '🍗';
  if (dish.includes('pork') || dish.includes('lechon')) return '🍖';
  if (dish.includes('kare') || dish.includes('sinigang')) return '🍲';
  return category === 'Dessert' ? '🍮' : category === 'Drinks' ? '🥤' : '🍽';
}

export default App;
