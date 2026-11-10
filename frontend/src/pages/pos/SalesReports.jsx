import React from 'react';
import { usePos } from '../../context/PosContext.jsx';
import { TrendingUp, DollarSign, CreditCard, Banknote, Calendar } from 'lucide-react';

export default function SalesReports() {
  const { sales } = usePos();

  const money = (val) =>
    `₱${Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalGross = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  // Breakdown by method
  const byMethod = sales.reduce((acc, s) => {
    const m = s.method || 'Cash';
    acc[m] = (acc[m] || 0) + Number(s.total || 0);
    return acc;
  }, {});

  // Group by date
  const byDate = sales.reduce((acc, s) => {
    const d = new Date(s.date).toLocaleDateString();
    if (!acc[d]) acc[d] = { date: d, count: 0, total: 0 };
    acc[d].count += 1;
    acc[d].total += Number(s.total || 0);
    return acc;
  }, {});

  const dailyRows = Object.values(byDate).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', margin: '0 0 4px', color: '#fff', fontWeight: 700 }}>
          Sales Transactions & Revenue Report
        </h1>
        <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
          Financial settlement summary, payment method distributions, and daily revenue performance.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>GROSS SALES VOLUME</span>
            <DollarSign size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{money(totalGross)}</div>
          <small style={{ color: '#10b981', fontSize: '11px' }}>All recorded POS sales</small>
        </div>

        <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>CASH SETTLEMENTS</span>
            <Banknote size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{money(byMethod['Cash'] || 0)}</div>
          <small style={{ color: '#888', fontSize: '11px' }}>Physical cash drawer intake</small>
        </div>

        <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>DIGITAL & CARDS (GCASH / MAYA)</span>
            <CreditCard size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>
            {money((byMethod['Card'] || 0) + (byMethod['GCash'] || 0) + (byMethod['Maya'] || 0))}
          </div>
          <small style={{ color: '#888', fontSize: '11px' }}>Electronic payments</small>
        </div>
      </div>

      {/* Daily Performance Table */}
      <div className="surface" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #222' }}>
          <h2 style={{ fontSize: '15px', margin: 0, color: '#fff', fontWeight: 700 }}>Daily Sales Breakdown</h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#121212', borderBottom: '1px solid #222', textAlign: 'left', color: '#666', fontSize: '11px' }}>
              <th style={{ padding: '12px 16px' }}>DATE</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>COMPLETED ORDERS</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>AVG ORDER VALUE</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>DAILY REVENUE</th>
            </tr>
          </thead>
          <tbody>
            {dailyRows.map((d) => (
              <tr key={d.date} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>{d.date}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: '#888' }}>{d.count}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', color: '#aaa' }}>
                  {money(d.count ? d.total / d.count : 0)}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>
                  {money(d.total)}
                </td>
              </tr>
            ))}
            {!dailyRows.length && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No historical sales data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

