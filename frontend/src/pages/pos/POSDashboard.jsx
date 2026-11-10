import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePos } from '../../context/PosContext.jsx';
import { ShoppingCart, History, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';

export default function POSDashboard() {
  const navigate = useNavigate();
  const { sales } = usePos();

  const todayStr = new Date().toDateString();
  const todaySales = sales
    .filter((s) => new Date(s.date).toDateString() === todayStr)
    .reduce((sum, s) => sum + Number(s.total || 0), 0);
  const todayCount = sales.filter((s) => new Date(s.date).toDateString() === todayStr).length;

  const money = (val) =>
    `₱${Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="pos-dashboard-view">
      <div className="hero-banner surface" style={{ padding: '28px', marginBottom: '24px', background: 'linear-gradient(135deg, #1f0808 0%, #121212 100%)', borderRadius: '12px', border: '1px solid #331111' }}>
        <div style={{ maxWidth: '600px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#ef4444', textTransform: 'uppercase' }}>
            FRONT OF HOUSE · ROXAS BRANCH
          </span>
          <h1 style={{ fontSize: '28px', margin: '8px 0 12px', color: '#ffffff', fontWeight: 800 }}>
            Every great meal <span style={{ color: '#ef4444', fontStyle: 'italic' }}>starts with great service.</span>
          </h1>
          <p style={{ color: '#a0a0a0', fontSize: '14px', margin: '0 0 20px' }}>
            Take orders, settle bills, print receipts, and monitor daily register activity from one place.
          </p>
          <button
            onClick={() => navigate('/pos/orders')}
            className="primary-button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <ShoppingCart size={16} />
            <span>Open Register & Order Processing</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>TODAY'S REVENUE</span>
            <DollarSign size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{money(todaySales)}</div>
          <small style={{ color: '#10b981', fontSize: '11px' }}>Recorded through register</small>
        </div>

        <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>TRANSACTIONS TODAY</span>
            <CheckCircle size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{todayCount}</div>
          <small style={{ color: '#888', fontSize: '11px' }}>Completed receipts</small>
        </div>

        <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>AVG TICKET SIZE</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>
            {money(todayCount > 0 ? todaySales / todayCount : 0)}
          </div>
          <small style={{ color: '#888', fontSize: '11px' }}>Per completed order</small>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="surface" style={{ padding: '20px', borderRadius: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', margin: 0, color: '#fff' }}>Recent Completed Transactions</h2>
            <p style={{ fontSize: '12px', color: '#888', margin: '4px 0 0' }}>Latest register checkout activity</p>
          </div>
          <button onClick={() => navigate('/pos/transactions')} className="text-link" style={{ fontSize: '12px' }}>
            View all transactions →
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #222', textAlign: 'left', color: '#666', fontSize: '11px' }}>
              <th style={{ padding: '8px' }}>RECEIPT #</th>
              <th style={{ padding: '8px' }}>DATE / TIME</th>
              <th style={{ padding: '8px' }}>ORDER TYPE</th>
              <th style={{ padding: '8px' }}>PAYMENT</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {sales.slice(0, 5).map((s) => (
              <tr key={s.id || s.receiptNumber} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '12px 8px', fontWeight: 600, color: '#fff' }}>{s.id || s.receiptNumber}</td>
                <td style={{ padding: '12px 8px', color: '#888' }}>{new Date(s.date).toLocaleTimeString()}</td>
                <td style={{ padding: '12px 8px' }}>{s.tableName || s.table || 'Walk-in'}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#1c1c1c', fontSize: '11px' }}>
                    {s.method || 'Cash'}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                  {money(s.total)}
                </td>
              </tr>
            ))}
            {!sales.length && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                  No transactions recorded today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

