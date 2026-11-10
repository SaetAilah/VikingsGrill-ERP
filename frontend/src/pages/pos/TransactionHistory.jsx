import React, { useState } from 'react';
import { usePos } from '../../context/PosContext.jsx';
import { Search, History, Filter } from 'lucide-react';

export default function TransactionHistory() {
  const { sales } = usePos();
  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');

  const money = (val) =>
    `₱${Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filtered = sales.filter((s) => {
    const id = String(s.id || s.receiptNumber || '');
    const matchesSearch = id.toLowerCase().includes(query.toLowerCase());
    const matchesMethod = methodFilter === 'All' || s.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', margin: '0 0 4px', color: '#fff', fontWeight: 700 }}>
            Transaction History
          </h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
            Complete audit trail of all receipts processed at this branch.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="surface" style={{ padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#666' }} />
          <input
            type="text"
            placeholder="Search by receipt number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 36px',
              background: '#121212',
              border: '1px solid #2a2a2a',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="#888" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#121212',
              border: '1px solid #2a2a2a',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px'
            }}
          >
            <option value="All">All Payment Types</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="GCash">GCash</option>
            <option value="Maya">Maya</option>
          </select>
        </div>

        <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>
          {filtered.length} TRANSACTIONS
        </span>
      </div>

      {/* Table */}
      <div className="surface" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#121212', borderBottom: '1px solid #222', textAlign: 'left', color: '#666', fontSize: '11px' }}>
              <th style={{ padding: '12px 16px' }}>RECEIPT #</th>
              <th style={{ padding: '12px 16px' }}>DATE & TIME</th>
              <th style={{ padding: '12px 16px' }}>ORDER TYPE</th>
              <th style={{ padding: '12px 16px' }}>PAYMENT METHOD</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>ITEMS</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>TOTAL AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id || s.receiptNumber} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                  {s.id || s.receiptNumber}
                </td>
                <td style={{ padding: '14px 16px', color: '#a0a0a0' }}>
                  {new Date(s.date).toLocaleString()}
                </td>
                <td style={{ padding: '14px 16px' }}>{s.tableName || s.table || 'Walk-in'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#1c1c1c', border: '1px solid #2a2a2a', fontSize: '11px' }}>
                    {s.method || 'Cash'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: '#888' }}>
                  {s.items || (s.lines ? s.lines.length : 1)}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>
                  {money(s.total)}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No transactions match your search filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

