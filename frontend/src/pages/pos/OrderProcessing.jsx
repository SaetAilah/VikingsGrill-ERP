import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePos } from '../../context/PosContext.jsx';
import { Plus, Minus, Trash2, ArrowRight, Search, ShoppingBag } from 'lucide-react';

export default function OrderProcessing() {
  const navigate = useNavigate();
  const { menu, cart, addToCart, changeQuantity, clearCart, total } = usePos();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', ...new Set(menu.map((m) => m.category).filter(Boolean))];

  const filteredMenu = menu.filter((item) => {
    if (!item.available && item.available !== undefined) return false;
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const money = (val) =>
    `₱${Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', height: 'calc(100vh - 104px)' }}>
      {/* Left Column: Menu Catalog */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Search & Categories Bar */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
            <input
              type="text"
              placeholder="Search dishes or item code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 38px',
                background: '#161616',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '55%' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? '#8b0000' : '#262626',
                  background: selectedCategory === cat ? '#8b0000' : '#141414',
                  color: selectedCategory === cat ? '#fff' : '#a0a0a0',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Cards Grid */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', paddingRight: '6px' }}>
          {filteredMenu.map((dish) => (
            <div
              key={dish.id}
              onClick={() => addToCart(dish)}
              style={{
                background: '#141414',
                border: '1px solid #222222',
                borderRadius: '10px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#8b0000')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#222222')}
            >
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#888', letterSpacing: '0.5px' }}>
                  {dish.code || 'ITEM'} · {dish.category}
                </span>
                <h3 style={{ fontSize: '15px', color: '#fff', margin: '6px 0 10px', fontWeight: 600 }}>
                  {dish.name}
                </h3>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444' }}>
                  {money(dish.price)}
                </span>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Plus size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Active Order / Cart */}
      <div style={{ background: '#131313', border: '1px solid #222', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} color="#ef4444" />
              <span>Current Order</span>
            </h2>
            <small style={{ color: '#888', fontSize: '11px' }}>Table: Walk-in</small>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Cart Item Lines */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {cart.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
              <div style={{ flex: 1, paddingRight: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{item.name}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>{money(item.price)} each</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => changeQuantity(item.id, -1)}
                  style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#222', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                  <Minus size={12} />
                </button>
                <span style={{ fontSize: '13px', fontWeight: 700, width: '20px', textAlign: 'center' }}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => changeQuantity(item.id, 1)}
                  style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#222', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                  <Plus size={12} />
                </button>
              </div>

              <div style={{ width: '70px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                {money(item.price * item.quantity)}
              </div>
            </div>
          ))}

          {!cart.length && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
              <ShoppingBag size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '13px' }}>Your ticket is empty.</p>
              <small style={{ fontSize: '11px' }}>Click dishes on the left to add items.</small>
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #222', background: '#0f0f0f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#888' }}>
            <span>Subtotal</span>
            <span>{money(total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '18px', fontWeight: 800, color: '#fff' }}>
            <span>Total Due</span>
            <span style={{ color: '#ef4444' }}>{money(total)}</span>
          </div>

          <button
            onClick={() => navigate('/pos/payment')}
            disabled={!cart.length}
            className="primary-button"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              opacity: cart.length ? 1 : 0.4,
              cursor: cart.length ? 'pointer' : 'not-allowed'
            }}
          >
            <span>Proceed to Payment</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

