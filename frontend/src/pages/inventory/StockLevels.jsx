import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext.jsx';
import { Search, ArrowUpDown, X, Check } from 'lucide-react';

export default function StockLevels() {
  const { items, adjustStock } = useInventory();
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('Stock count correction');
  const [busy, setBusy] = useState(false);

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(query.toLowerCase())),
  );

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!delta || isNaN(Number(delta))) return;

    setBusy(true);
    try {
      await adjustStock(selectedItem.id, Number(delta), reason);
      setSelectedItem(null);
      setDelta('');
    } catch {
      // Ignored
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', margin: '0 0 4px', color: '#fff', fontWeight: 700 }}>
          Stock Levels & Physical Audit
        </h1>
        <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
          Review physical inventory counts against system records and perform variance adjustments.
        </p>
      </div>

      {/* Search */}
      <div className="surface" style={{ padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#666' }} />
          <input
            type="text"
            placeholder="Search stock by name or SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 10px 8px 36px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>
        <span style={{ fontSize: '12px', color: '#888' }}>{filtered.length} AUDIT RECORDS</span>
      </div>

      {/* Table */}
      <div className="surface" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#121212', borderBottom: '1px solid #222', textAlign: 'left', color: '#666', fontSize: '11px' }}>
              <th style={{ padding: '12px 16px' }}>SKU</th>
              <th style={{ padding: '12px 16px' }}>ITEM NAME</th>
              <th style={{ padding: '12px 16px' }}>CATEGORY</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>CURRENT QUANTITY</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>REORDER LEVEL</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>HEALTH STATUS</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isLow = Number(item.quantity) <= Number(item.reorder);
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#888' }}>{item.sku || '—'}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>{item.name}</td>
                  <td style={{ padding: '14px 16px', color: '#aaa' }}>{item.category}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: isLow ? '#f59e0b' : '#fff' }}>
                    {item.quantity} {item.unit}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: '#888' }}>
                    {item.reorder} {item.unit}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        background: isLow ? '#451a03' : '#064e3b',
                        color: isLow ? '#f59e0b' : '#34d399',
                      }}
                    >
                      {isLow ? 'Needs Reorder' : 'Healthy'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setDelta('');
                      }}
                      className="secondary-button"
                      style={{ fontSize: '11px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ArrowUpDown size={12} />
                      <span>Adjust Stock</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Adjust Stock Modal */}
      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="surface" style={{ width: '400px', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 700 }}>
                  Adjust Stock Level
                </h3>
                <small style={{ color: '#888' }}>{selectedItem.name} ({selectedItem.quantity} {selectedItem.unit} on hand)</small>
              </div>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAdjust}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>
                  QUANTITY CHANGE (+ FOR ADDITION, - FOR DEDUCTION)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. +5 or -2.5"
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '14px', fontWeight: 700, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 700, marginBottom: '6px' }}>
                  REASON FOR ADJUSTMENT
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  <option value="Stock count correction">Stock count correction / Physical audit</option>
                  <option value="Damaged / Spoilage">Damaged / Kitchen spoilage</option>
                  <option value="Direct kitchen purchase">Direct kitchen purchase / Local cash buy</option>
                  <option value="Internal usage">Internal staff meal / Tasting</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setSelectedItem(null)} className="secondary-button" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="primary-button" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  {busy ? 'Saving…' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

