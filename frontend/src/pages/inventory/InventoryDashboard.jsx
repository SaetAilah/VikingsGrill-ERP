import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext.jsx';
import { Boxes, AlertTriangle, Truck, FileCheck, ArrowRight, Package } from 'lucide-react';

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const { items, lowStock, orders, suppliers } = useInventory();

  const totalValuation = items.reduce(
    (sum, i) => sum + Number(i.quantity || 0) * Number(i.cost || 0),
    0,
  );

  const money = (val) =>
    `₱${Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const healthyCount = items.length - lowStock.length;
  const healthyPct = items.length ? Math.round((healthyCount / items.length) * 100) : 100;

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner surface" style={{ padding: '28px', marginBottom: '24px', background: 'linear-gradient(135deg, #1f0a0a 0%, #121212 100%)', borderRadius: '12px', border: '1px solid #331111' }}>
        <div style={{ maxWidth: '600px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#ef4444', textTransform: 'uppercase' }}>
            KITCHEN OPERATIONS & STOCKROOM · ROXAS
          </span>
          <h1 style={{ fontSize: '28px', margin: '8px 0 12px', color: '#ffffff', fontWeight: 800 }}>
            Well-stocked kitchen. <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Seamless service.</span>
          </h1>
          <p style={{ color: '#a0a0a0', fontSize: '14px', margin: '0 0 20px' }}>
            Keep ingredients fresh, supplies ready, and every delivery accounted for across all shifts.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/inventory/procurement')}
              className="primary-button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
            >
              <FileCheck size={16} />
              <span>Create Purchase Order</span>
            </button>
            <button
              onClick={() => navigate('/inventory/movements')}
              className="secondary-button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
            >
              <span>Record Stock Movement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>WAREHOUSE VALUATION</span>
            <Boxes size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{money(totalValuation)}</div>
          <small style={{ color: '#888', fontSize: '11px' }}>Current stock on hand</small>
        </div>

        <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>STOCK HEALTH</span>
            <Package size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{healthyPct}%</div>
          <small style={{ color: '#10b981', fontSize: '11px' }}>{healthyCount} of {items.length} items optimal</small>
        </div>

        <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>NEEDS REORDER</span>
            <AlertTriangle size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: lowStock.length ? '#f59e0b' : '#fff' }}>
            {lowStock.length}
          </div>
          <small style={{ color: '#888', fontSize: '11px' }}>Below reorder threshold</small>
        </div>

        <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>ACTIVE SUPPLIERS</span>
            <Truck size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{suppliers.length}</div>
          <small style={{ color: '#888', fontSize: '11px' }}>Mindoro partner vendors</small>
        </div>
      </div>

      {/* Critical Low Stock Alert Table */}
      <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', margin: 0, color: '#fff' }}>Reorder Attention</h2>
            <p style={{ fontSize: '12px', color: '#888', margin: '4px 0 0' }}>Items closest to or below threshold</p>
          </div>
          <button onClick={() => navigate('/inventory/alerts')} className="text-link" style={{ fontSize: '12px' }}>
            View all alerts ({lowStock.length}) →
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #222', textAlign: 'left', color: '#666', fontSize: '11px' }}>
              <th style={{ padding: '8px' }}>SKU</th>
              <th style={{ padding: '8px' }}>ITEM NAME</th>
              <th style={{ padding: '8px' }}>CATEGORY</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>ON HAND</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>REORDER AT</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.slice(0, 5).map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: '#888' }}>{item.sku || '—'}</td>
                <td style={{ padding: '12px 8px', fontWeight: 600, color: '#fff' }}>{item.name}</td>
                <td style={{ padding: '12px 8px', color: '#aaa' }}>{item.category}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#f59e0b' }}>
                  {item.quantity} {item.unit}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#888' }}>
                  {item.reorder} {item.unit}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <button
                    onClick={() => navigate('/inventory/procurement')}
                    className="primary-button"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    Reorder PO
                  </button>
                </td>
              </tr>
            ))}
            {!lowStock.length && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#10b981' }}>
                  ✓ All stock items are above their reorder points.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

