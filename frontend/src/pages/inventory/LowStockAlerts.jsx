import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext.jsx';
import { AlertTriangle, PlusCircle, CheckCircle } from 'lucide-react';

export default function LowStockAlerts() {
  const navigate = useNavigate();
  const { lowStock } = useInventory();

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', margin: '0 0 4px', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} color="#f59e0b" />
          <span>Low-Stock & Reorder Alerts</span>
        </h1>
        <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
          Items currently at or below minimum threshold requiring immediate replenishment.
        </p>
      </div>

      <div className="surface" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#121212', borderBottom: '1px solid #222', textAlign: 'left', color: '#666', fontSize: '11px' }}>
              <th style={{ padding: '12px 16px' }}>SKU</th>
              <th style={{ padding: '12px 16px' }}>ITEM NAME</th>
              <th style={{ padding: '12px 16px' }}>CATEGORY</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>REMAINING ON HAND</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>REORDER POINT</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>DEFICIT</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((item) => {
              const deficit = Math.max(0, Number(item.reorder) - Number(item.quantity));
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#888' }}>{item.sku || '—'}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>{item.name}</td>
                  <td style={{ padding: '14px 16px', color: '#aaa' }}>{item.category}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>
                    {item.quantity} {item.unit}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: '#888' }}>
                    {item.reorder} {item.unit}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>
                    -{deficit.toFixed(2)} {item.unit}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => navigate('/inventory/procurement')}
                      className="primary-button"
                      style={{ fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <PlusCircle size={12} />
                      <span>Order Supply</span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {!lowStock.length && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '50px', color: '#10b981' }}>
                  <CheckCircle size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>All inventory items are adequately stocked.</p>
                  <small style={{ color: '#888' }}>No active reorder alerts at this time.</small>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

