import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext.jsx';
import { Search, ArrowLeftRight, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export default function StockMovements() {
  const { movements, refreshMovements } = useInventory();
  const [query, setQuery] = useState('');

  const filtered = movements.filter((m) => {
    const name = String(m.itemName || '');
    const reason = String(m.reason || '');
    const ref = String(m.referenceNo || '');
    return (
      name.toLowerCase().includes(query.toLowerCase()) ||
      reason.toLowerCase().includes(query.toLowerCase()) ||
      ref.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', margin: '0 0 4px', color: '#fff', fontWeight: 700 }}>
            Stock Movements & Audit History
          </h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
            Detailed ledger of all stock intake, POS menu deductions, spoilage, and manual adjustments.
          </p>
        </div>

        <button
          onClick={refreshMovements}
          className="secondary-button"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
        >
          <RefreshCw size={14} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Search */}
      <div className="surface" style={{ padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#666' }} />
          <input
            type="text"
            placeholder="Search by ingredient, reason, or reference #..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 10px 8px 36px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>
        <span style={{ fontSize: '12px', color: '#888' }}>{filtered.length} MOVEMENTS RECORDED</span>
      </div>

      {/* Table */}
      <div className="surface" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#121212', borderBottom: '1px solid #222', textAlign: 'left', color: '#666', fontSize: '11px' }}>
              <th style={{ padding: '12px 16px' }}>DATE & TIME</th>
              <th style={{ padding: '12px 16px' }}>INGREDIENT / ITEM</th>
              <th style={{ padding: '12px 16px' }}>TYPE</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>QUANTITY CHANGE</th>
              <th style={{ padding: '12px 16px' }}>REASON / AUDIT NOTE</th>
              <th style={{ padding: '12px 16px' }}>REFERENCE #</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const isPositive = Number(m.quantity) > 0;
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '14px 16px', color: '#888' }}>
                    {new Date(m.date).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>
                    {m.itemName} <small style={{ color: '#666', fontFamily: 'monospace' }}>({m.sku || 'SKU'})</small>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        background: m.type === 'Addition' ? '#064e3b' : m.type === 'Deduction' ? '#450a0a' : '#27272a',
                        color: m.type === 'Addition' ? '#34d399' : m.type === 'Deduction' ? '#f87171' : '#e4e4e7',
                      }}
                    >
                      {m.type}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      textAlign: 'right',
                      fontWeight: 700,
                      color: isPositive ? '#10b981' : '#ef4444',
                    }}
                  >
                    {isPositive ? `+${m.quantity}` : m.quantity} {m.unit}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#ccc' }}>{m.reason}</td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#888' }}>
                    {m.referenceNo || '—'}
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No stock movements recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

