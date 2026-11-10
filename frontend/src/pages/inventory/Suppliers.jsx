import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext.jsx';
import inventoryApi from '../../services/inventoryApi.js';
import { Plus, Truck, Phone, Mail, X } from 'lucide-react';

export default function Suppliers() {
  const { suppliers, refreshSuppliers } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    contact: '',
    email: '',
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Supplier name is required.');

    setBusy(true);
    setError('');
    try {
      await inventoryApi.createSupplier(form);
      await refreshSuppliers();
      setIsModalOpen(false);
      setForm({ name: '', contact: '', email: '' });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not save supplier.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', margin: '0 0 4px', color: '#fff', fontWeight: 700 }}>
            Supplier Management
          </h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
            Directory of partner meat, seafood, fresh produce, and grain vendors across Oriental Mindoro.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="primary-button"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
        >
          <Plus size={15} />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Supplier Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {suppliers.map((s) => (
          <div key={s.id} className="surface" style={{ padding: '20px', borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 700 }}>{s.name}</h3>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: s.status === 'Active' ? '#064e3b' : '#331111', color: s.status === 'Active' ? '#34d399' : '#f87171' }}>
                  {s.status || 'Active'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px' }}>Primary regional food vendor</p>
            </div>

            <div style={{ borderTop: '1px solid #222', paddingTop: '12px', fontSize: '12px', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="#888" />
                <span>{s.contact || 'No phone provided'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="#888" />
                <span>{s.email || 'No email provided'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="surface" style={{ width: '400px', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 700 }}>Add Vendor Supplier</h3>
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
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>SUPPLIER / COMPANY NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Calapan Fish Port Traders"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '9px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>PHONE / MOBILE CONTACT</label>
                <input
                  type="text"
                  placeholder="0917 123 4567"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="orders@vendor.example"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="secondary-button" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="primary-button" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  {busy ? 'Saving…' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

