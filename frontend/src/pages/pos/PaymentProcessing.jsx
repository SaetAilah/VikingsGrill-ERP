import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePos } from '../../context/PosContext.jsx';
import { ArrowLeft, Check, CreditCard, Banknote, Smartphone, CheckCircle } from 'lucide-react';

export default function PaymentProcessing() {
  const navigate = useNavigate();
  const { cart, total, paymentMethod, setPaymentMethod, amountTendered, setAmountTendered, checkout } = usePos();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const money = (val) =>
    `₱${Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const numTendered = Number(amountTendered || 0);
  const change = Math.max(0, numTendered - total);

  const handleComplete = async () => {
    if (!cart.length) {
      setError('Please add items to your order first.');
      return;
    }
    if (paymentMethod === 'Cash' && numTendered < total) {
      setError('Amount tendered cannot be less than the total due.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await checkout();
      navigate('/pos/receipt');
    } catch (err) {
      setError(err.message || 'Payment processing failed.');
    } finally {
      setBusy(false);
    }
  };

  const methods = [
    { id: 'Cash', label: 'Cash', icon: Banknote },
    { id: 'Card', label: 'Credit / Debit Card', icon: CreditCard },
    { id: 'GCash', label: 'GCash (QR / Mobile)', icon: Smartphone },
    { id: 'Maya', label: 'Maya (QR / Wallet)', icon: Smartphone },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
      {/* Left Form */}
      <div className="surface" style={{ padding: '24px', borderRadius: '12px' }}>
        <button
          onClick={() => navigate('/pos/orders')}
          style={{ background: 'transparent', border: 'none', color: '#888', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', marginBottom: '16px', padding: 0 }}
        >
          <ArrowLeft size={14} />
          <span>Back to order selection</span>
        </button>

        <h1 style={{ fontSize: '20px', margin: '0 0 6px', color: '#fff', fontWeight: 700 }}>
          Payment & Settlement
        </h1>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 20px' }}>
          Select the customer’s payment method and record the transaction.
        </p>

        {error && (
          <div style={{ padding: '12px', background: '#3b0d0d', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '0.8px', marginBottom: '10px' }}>
          SELECT PAYMENT METHOD
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          {methods.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setPaymentMethod(id);
                if (id !== 'Cash') setAmountTendered(total.toFixed(2));
              }}
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: paymentMethod === id ? '#8b0000' : '#262626',
                background: paymentMethod === id ? '#220808' : '#171717',
                color: paymentMethod === id ? '#fff' : '#a0a0a0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} color={paymentMethod === id ? '#ef4444' : '#888'} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{label}</span>
              </div>
              {paymentMethod === id && <Check size={16} color="#ef4444" />}
            </button>
          ))}
        </div>

        {paymentMethod === 'Cash' && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '0.8px', marginBottom: '8px' }}>
              AMOUNT TENDERED (CASH RECEIVED)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '12px', fontSize: '16px', fontWeight: 700, color: '#888' }}>
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                placeholder={total.toFixed(2)}
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 34px',
                  background: '#121212',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: 700,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Quick denomination buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {[total, 500, 1000, 2000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmountTendered(preset.toFixed(2))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    background: '#222',
                    border: '1px solid #333',
                    color: '#ddd',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ₱{preset}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleComplete}
          disabled={busy || !cart.length}
          className="primary-button"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '15px',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            cursor: busy ? 'wait' : 'pointer'
          }}
        >
          <CheckCircle size={18} />
          <span>{busy ? 'Recording Transaction…' : `Complete Payment (${money(total)})`}</span>
        </button>
      </div>

      {/* Right Column: Order Summary */}
      <div className="surface" style={{ padding: '24px', borderRadius: '12px', height: 'fit-content' }}>
        <h2 style={{ fontSize: '15px', margin: '0 0 16px', color: '#fff', fontWeight: 700, borderBottom: '1px solid #222', paddingBottom: '10px' }}>
          Summary
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#888' }}>
          <span>Items in Ticket</span>
          <span>{cart.reduce((s, i) => s + i.quantity, 0)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#888' }}>
          <span>Subtotal</span>
          <span>{money(total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px', color: '#888' }}>
          <span>Tax & Service</span>
          <span>₱0.00</span>
        </div>

        <div style={{ borderTop: '1px solid #222', paddingTop: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, color: '#fff' }}>
            <span>Total Due</span>
            <span style={{ color: '#ef4444' }}>{money(total)}</span>
          </div>
        </div>

        {paymentMethod === 'Cash' && numTendered > 0 && (
          <div style={{ background: '#171717', padding: '12px', borderRadius: '8px', border: '1px solid #262626' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '4px' }}>
              <span>Cash Tendered</span>
              <span>{money(numTendered)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, color: '#10b981' }}>
              <span>Change Due</span>
              <span>{money(change)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

