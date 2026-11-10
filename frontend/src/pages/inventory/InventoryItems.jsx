import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext.jsx';
import inventoryApi from '../../services/inventoryApi.js';
import { Plus, Search, Filter, X, Package } from 'lucide-react';

export default function InventoryItems() {
  const { items, refreshItems, suppliers } = useInventory();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: 'Meat & poultry',
    unit: 'kg',
    quantity: 0,
    reorder: 10,
    cost: 0,
    type: 'Ingredient',
    supplierId: '',
  });

  const money = (val) =>
    `₱${Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filtered = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(query.toLowerCase())) ||
      item.category.toLowerCase().includes(query.toLowerCase());
    const matchesType = typeFilter === 'All' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await inventoryApi.createItem({
        ...form,
        quantity: Number(form.quantity),
        reorder: Number(form.reorder),
        cost: Number(form.cost),
        supplierId: form.supplierId ? Number(form.supplierId) : null,
      });
      await refreshItems();
      setIsModalOpen(false);
      setForm({ sku: '', name: '', category: 'Meat & poultry', unit: 'kg', quantity: 0, reorder: 10, cost: 0, type: 'Ingredient', supplierId: '' });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not save inventory item.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', margin: '0 0 4px', color: '#fff', fontWeight: 700 }}>
            Inventory Items & Ingredients
          </h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
            Full catalog of kitchen ingredients and restaurant operating supplies.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="primary-button"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
        >
          <Plus size={15} />
          <span>Add New Stock Item</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="surface" style={{ padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#666' }} />
          <input
            type="text"
            placeholder="Search by SKU, item name, or category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 10px 8px 36px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="#888" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
          >
            <option value="All">All Types</option>
            <option value="Ingredient">Ingredient</option>
            <option value="Supply">Supply</option>
          </select>
        </div>

        <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>
          {filtered.length} ITEMS
        </span>
      </div>

      {/* Table */}
      <div className="surface" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#121212', borderBottom: '1px solid #222', textAlign: 'left', color: '#666', fontSize: '11px' }}>
              <th style={{ padding: '12px 16px' }}>SKU</th>
              <th style={{ padding: '12px 16px' }}>NAME</th>
              <th style={{ padding: '12px 16px' }}>CATEGORY</th>
              <th style={{ padding: '12px 16px' }}>TYPE</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>ON HAND</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>REORDER POINT</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>UNIT COST</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#888' }}>{item.sku || '—'}</td>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>{item.name}</td>
                <td style={{ padding: '14px 16px', color: '#aaa' }}>{item.category}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      background: item.type === 'Ingredient' ? '#1e293b' : '#27272a',
                      color: item.type === 'Ingredient' ? '#38bdf8' : '#e4e4e7',
                    }}
                  >
                    {item.type}
                  </span>
                </td>
                <td
                  style={{
                    padding: '14px 16px',
                    textAlign: 'right',
                    fontWeight: 700,
                    color: Number(item.quantity) <= Number(item.reorder) ? '#f59e0b' : '#fff',
                  }}
                >
                  {item.quantity} {item.unit}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', color: '#888' }}>
                  {item.reorder} {item.unit}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                  {money(item.cost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="surface" style={{ width: '460px', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 700 }}>Add Stock Item</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px', background: '#3b0d0d', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>SKU CODE</label>
                  <input
                    type="text"
                    placeholder="ING-007"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>ITEM TYPE</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="Ingredient">Ingredient</option>
                    <option value="Supply">Supply</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>ITEM NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Ground Beef"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>CATEGORY</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>UNIT OF MEASURE</label>
                  <input
                    type="text"
                    placeholder="kg, L, pcs, box"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>INITIAL QTY</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>REORDER AT</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.reorder}
                    onChange={(e) => setForm({ ...form, reorder: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>UNIT COST (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>PRIMARY SUPPLIER</label>
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  <option value="">None / Direct Sourcing</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="secondary-button" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="primary-button" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  {busy ? 'Saving…' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

