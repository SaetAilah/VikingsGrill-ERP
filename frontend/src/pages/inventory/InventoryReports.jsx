import React from 'react';
import { useInventory } from '../../context/InventoryContext.jsx';
import { FileSpreadsheet, DollarSign, Package, PieChart } from 'lucide-react';

export default function InventoryReports() {
  const { items, lowStock } = useInventory();

  const money = (val) =>
    `₱${Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalValue = items.reduce(
    (sum, i) => sum + Number(i.quantity || 0) * Number(i.cost || 0),
    0,
  );

  // Group valuation by category
  const byCategory = items.reduce((acc, i) => {
    const cat = i.category || 'Other';
    if (!acc[cat]) acc[cat] = { count: 0, value: 0 };
    acc[cat].count += 1;
    acc[cat].value += Number(i.quantity || 0) * Number(i.cost || 0);
    return acc;
  }, {});

  const catRows = Object.entries(byCategory).map(([cat, data]) => ({
    category: cat,
    ...data,
  })).sort((a, b) => b.value - a.value);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', margin: '0 0 4px', color: '#fff', fontWeight: 700 }}>
          Inventory Valuation & Stock Reports
        </h1>
        <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
          Stock capital investment, category valuations, and warehouse asset distribution.
        </p>
      </div>

      {/* Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>TOTAL ASSET VALUATION</span>
            <DollarSign size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{money(totalValue)}</div>
          <small style={{ color: '#888', fontSize: '11px' }}>Total cost of goods on hand</small>
        </div>

        <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>MANAGED INVENTORY LINES</span>
            <Package size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{items.length}</div>
          <small style={{ color: '#888', fontSize: '11px' }}>Raw items and supplies</small>
        </div>

        <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>CATEGORIES MONITORED</span>
            <PieChart size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{catRows.length}</div>
          <small style={{ color: '#888', fontSize: '11px' }}>Active food and beverage groups</small>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="surface" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #222' }}>
          <h2 style={{ fontSize: '15px', margin: 0, color: '#fff', fontWeight: 700 }}>Valuation by Department Category</h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#121212', borderBottom: '1px solid #222', textAlign: 'left', color: '#666', fontSize: '11px' }}>
              <th style={{ padding: '12px 16px' }}>CATEGORY</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>UNIQUE ITEMS</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>VALUATION PERCENTAGE</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>TOTAL HOLDING VALUE</th>
            </tr>
          </thead>
          <tbody>
            {catRows.map((cat) => {
              const pct = totalValue ? Math.round((cat.value / totalValue) * 100) : 0;
              return (
                <tr key={cat.category} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>{cat.category}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: '#888' }}>{cat.count}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: '#aaa' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px' }}>{pct}%</span>
                      <div style={{ width: '60px', height: '6px', background: '#222', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#ef4444' }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>
                    {money(cat.value)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

