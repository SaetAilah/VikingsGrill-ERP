import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext.jsx';
import inventoryApi from '../../services/inventoryApi.js';
import { Plus, Check, FileCheck, X, CheckCircle, Clock } from 'lucide-react';

export default function PurchaseOrders() {
  const { orders, refreshOrders, suppliers, items, refreshItems, refreshMovements } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    supplierId: '',
    itemId: '',
    quantity: '',
    unitCost: '',
  });

  const money = (val) =>
    `₱${Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.supplierId || !form.itemId || !form.quantity || !form.unitCost) {
      setError('Select supplier, item, and enter positive quantity & cost.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await inventoryApi.createOrder({
        supplierId: Number(form.supplierId),
        itemId: Number(form.itemId),
        quantity: Number(form.quantity),
        unitCost: Number(form.unitCost),
      });
      await refreshOrders();
      setIsModalOpen(false);
      setForm({ supplierId: '', itemId: '', quantity: '', unitCost: '' });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not create purchase order.');
    } finally {
      setBusy(false);
    }
  };

  const handleReceive = async (orderNo) => {
    if (!confirm(`Mark purchase order ${orderNo} as received and add items to warehouse stock?`)) return;

    try {
      await inventoryApi.receiveOrder(orderNo);
      await refreshOrders();
      await refreshItems();
      await refreshMovements();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to receive order.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', margin: '0 0 4px', color: '#fff', fontWeight: 700 }}>
            Procurement & Purchase Orders
          </h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
            Manage supplier replenishment orders and record incoming delivery stock intakes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="primary-button"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
        >
          <Plus size={15} />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* Table */}
      <div className="surface" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#121212', borderBottom: '1px solid #222', textAlign: 'left', color: '#666', fontSize: '11px' }}>
              <th style={{ padding: '12px 16px' }}>PO NUMBER</th>
              <th style={{ padding: '12px 16px' }}>DATE</th>
              <th style={{ padding: '12px 16px' }}>SUPPLIER VENDOR</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>LINES</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>TOTAL AMOUNT</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>STATUS</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((po) => {
              const isReceived = po.status === 'Received';
              return (
                <tr key={po.id || po.orderNumber} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#fff' }}>
                    {po.orderNumber || po.id}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#888' }}>
                    {po.date ? new Date(po.date).toLocaleDateString() : 'Today'}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#ddd' }}>
                    {po.supplier}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: '#888' }}>
                    {po.lines || 1}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                    {money(po.amount)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        background: isReceived ? '#064e3b' : '#3d2003',
                        color: isReceived ? '#34d399' : '#f59e0b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isReceived ? <Check size={11} /> : <Clock size={11} />}
                      <span>{po.status}</span>
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {!isReceived && (
                      <button
                        onClick={() => handleReceive(po.orderNumber || po.id)}
                        className="primary-button"
                        style={{ fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckCircle size={12} />
                        <span>Receive Delivery</span>
                      </button>
                    )}
                    {isReceived && (
                      <span style={{ fontSize: '11px', color: '#666' }}>Stock Credited</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!orders.length && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No purchase orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="surface" style={{ width: '440px', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 700 }}>Create Purchase Order</h3>
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
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>SUPPLIER VENDOR</label>
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '9px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  <option value="">Select a vendor...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>INGREDIENT / SUPPLY ITEM</label>
                <select
                  value={form.itemId}
                  onChange={(e) => {
                    const sel = items.find((i) => String(i.id) === e.target.value);
                    setForm({
                      ...form,
                      itemId: e.target.value,
                      unitCost: sel ? sel.cost : form.unitCost,
                    });
                  }}
                  required
                  style={{ width: '100%', padding: '9px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  <option value="">Select item to order...</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>ORDER QUANTITY</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 25"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                    style={{ width: '100%', padding: '9px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>UNIT COST (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.unitCost}
                    onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                    required
                    style={{ width: '100%', padding: '9px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="secondary-button" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="primary-button" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  {busy ? 'Creating…' : 'Generate PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

