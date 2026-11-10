import React, { useState } from 'react';
import { usePos } from '../../context/PosContext.jsx';
import posApi from '../../services/posApi.js';
import { Plus, Edit2, Archive, RefreshCw, Check, X } from 'lucide-react';

const CATEGORIES = ['Grill', 'Main course', 'Sides', 'Dessert', 'Drinks', 'Appetizers'];

export default function MenuManagement() {
  const { menu, refreshMenu } = usePos();
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'Grill',
    price: '',
    available: true,
  });

  const money = (val) =>
    `₱${Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const openCreate = () => {
    setEditingItem(null);
    setForm({ code: '', name: '', category: 'Grill', price: '', available: true });
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      code: item.code || '',
      name: item.name || '',
      category: item.category || 'Grill',
      price: item.price || '',
      available: item.available !== false,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      setError('Dish name and price are required.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const payload = {
        code: form.code.trim() || `ITM-${Date.now().toString().slice(-4)}`,
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        available: form.available,
      };

      if (editingItem?.id) {
        await posApi.updateMenuItem(editingItem.id, payload);
      } else {
        await posApi.createMenuItem(payload);
      }

      await refreshMenu();
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not save menu item.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleArchive = async (item) => {
    try {
      if (item.available) {
        await posApi.deleteMenuItem(item.id);
      } else {
        await posApi.updateMenuItem(item.id, { ...item, available: true });
      }
      await refreshMenu();
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const filteredItems = menu.filter((item) => showArchived || item.available !== false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', margin: '0 0 4px', color: '#fff', fontWeight: 700 }}>
            Restaurant Menu Management
          </h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
            Add, update pricing, or change availability of dishes served on the floor.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="secondary-button"
            style={{ fontSize: '12px', padding: '8px 14px' }}
          >
            {showArchived ? 'Hide Inactive Items' : 'Show Inactive Items'}
          </button>
          <button
            onClick={openCreate}
            className="primary-button"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
          >
            <Plus size={15} />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Menu Table */}
      <div className="surface" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#121212', borderBottom: '1px solid #222', textAlign: 'left', color: '#666', fontSize: '11px' }}>
              <th style={{ padding: '12px 16px' }}>CODE</th>
              <th style={{ padding: '12px 16px' }}>DISH NAME</th>
              <th style={{ padding: '12px 16px' }}>CATEGORY</th>
              <th style={{ padding: '12px 16px' }}>PRICE</th>
              <th style={{ padding: '12px 16px' }}>STATUS</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #1a1a1a', opacity: item.available ? 1 : 0.5 }}>
                <td style={{ padding: '14px 16px', fontWeight: 700, fontFamily: 'monospace', color: '#888' }}>
                  {item.code || '—'}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>{item.name}</td>
                <td style={{ padding: '14px 16px', color: '#aaa' }}>{item.category}</td>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#ef4444' }}>
                  {money(item.price)}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      background: item.available ? '#064e3b' : '#331111',
                      color: item.available ? '#34d399' : '#f87171',
                    }}
                  >
                    {item.available ? 'Available' : 'Archived'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                    <button
                      onClick={() => openEdit(item)}
                      style={{ background: '#222', border: 'none', color: '#fff', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                      title="Edit dish"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleToggleArchive(item)}
                      style={{ background: '#222', border: 'none', color: item.available ? '#ef4444' : '#10b981', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                      title={item.available ? 'Archive dish' : 'Restore dish'}
                    >
                      {item.available ? <Archive size={13} /> : <RefreshCw size={13} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="surface" style={{ width: '420px', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 700 }}>
                {editingItem ? 'Edit Menu Dish' : 'Add New Menu Dish'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px', background: '#3b0d0d', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>ITEM CODE / SKU</label>
                <input
                  type="text"
                  placeholder="e.g. GR-007"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>DISH NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Sizzling Sisig"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '9px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>CATEGORY</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>PRICE (PHP)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  style={{ width: '100%', padding: '9px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="secondary-button"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="primary-button"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  {busy ? 'Saving…' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

