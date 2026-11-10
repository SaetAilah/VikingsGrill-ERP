import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePos } from '../../context/PosContext.jsx';
import { Printer, PlusCircle, CheckCircle, Receipt as ReceiptIcon } from 'lucide-react';

export default function ReceiptScreen() {
  const navigate = useNavigate();
  const { lastReceipt } = usePos();

  const money = (val) =>
    `₱${Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (!lastReceipt) {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto', textAlign: 'center', color: '#888' }}>
        <ReceiptIcon size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
        <h2 style={{ color: '#fff', fontSize: '18px', margin: '0 0 8px' }}>No Receipt Available</h2>
        <p style={{ fontSize: '13px', margin: '0 0 20px' }}>Complete an order payment to generate a customer sales receipt.</p>
        <button
          onClick={() => navigate('/pos/orders')}
          className="primary-button"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <PlusCircle size={16} />
          <span>Start New Order</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start' }}>
      {/* Printed Receipt Simulator Card */}
      <div
        className="receipt-card"
        style={{
          background: '#ffffff',
          color: '#111111',
          padding: '24px',
          borderRadius: '12px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 800, letterSpacing: '1px' }}>
            VIKINGS GRILL
          </h2>
          <small style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase' }}>
            Roxas Branch · Bar · Billiards · KTV
          </small>
        </div>

        <div style={{ borderTop: '1px dashed #bbb', borderBottom: '1px dashed #bbb', padding: '10px 0', margin: '12px 0', fontSize: '11px', lineHeight: '1.6' }}>
          <div><strong>RECEIPT #:</strong> {lastReceipt.id}</div>
          <div><strong>DATE:</strong> {new Date(lastReceipt.date).toLocaleString()}</div>
          <div><strong>ORDER TYPE:</strong> {lastReceipt.table || 'Walk-in'}</div>
          <div><strong>PAYMENT:</strong> {lastReceipt.method}</div>
        </div>

        {/* Lines */}
        <div style={{ margin: '14px 0' }}>
          {(lastReceipt.lines || []).map((line) => (
            <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>
                {line.quantity} × {line.name}
              </span>
              <span>{money(line.price * line.quantity)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px dashed #bbb', paddingTop: '10px', marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, marginBottom: '6px' }}>
            <span>TOTAL PAID</span>
            <span>{money(lastReceipt.total)}</span>
          </div>

          {lastReceipt.method === 'Cash' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555' }}>
                <span>Amount Tendered</span>
                <span>{money(lastReceipt.amountTendered)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555' }}>
                <span>Change</span>
                <span>{money(lastReceipt.change)}</span>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#666', borderTop: '1px solid #eee', paddingTop: '12px' }}>
          Thank you for dining with us at Vikings Grill!
        </div>
      </div>

      {/* Action Buttons & Status */}
      <div className="surface" style={{ padding: '24px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', marginBottom: '16px' }}>
          <CheckCircle size={24} />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 700 }}>Transaction Recorded</h3>
            <small style={{ color: '#888' }}>Stock levels have been adjusted automatically.</small>
          </div>
        </div>

        <p style={{ color: '#a0a0a0', fontSize: '13px', margin: '0 0 24px', lineHeight: '1.5' }}>
          Receipt <strong>{lastReceipt.id}</strong> was written to the sales ledger. Ingredients were deducted transactionally from the inventory warehouse.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => window.print()}
            className="primary-button"
            style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} />
            <span>Print Customer Receipt</span>
          </button>

          <button
            onClick={() => navigate('/pos/orders')}
            className="secondary-button"
            style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <PlusCircle size={16} />
            <span>Start Another Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}

