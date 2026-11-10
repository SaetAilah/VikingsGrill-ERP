import React, { createContext, useContext, useEffect, useState } from 'react';
import posApi from '../services/posApi.js';

const PosContext = createContext(null);

const DEFAULT_MENU = [
  { id: 1, name: 'Grilled Pork Belly', category: 'Grill', price: 289, available: true, code: 'GR-001' },
  { id: 2, name: 'Chicken Inasal', category: 'Grill', price: 249, available: true, code: 'GR-002' },
  { id: 3, name: 'Beef Kare-Kare', category: 'Main course', price: 325, available: true, code: 'MC-014' },
  { id: 4, name: 'Garlic Rice', category: 'Sides', price: 65, available: true, code: 'SD-003' },
  { id: 5, name: 'Sinigang na Baboy', category: 'Main course', price: 299, available: true, code: 'MC-009' },
  { id: 6, name: 'Halo-Halo', category: 'Dessert', price: 145, available: true, code: 'DS-002' },
  { id: 7, name: 'Iced Tea Pitcher', category: 'Drinks', price: 120, available: true, code: 'DR-005' },
  { id: 8, name: 'Lechon Kawali', category: 'Grill', price: 315, available: true, code: 'GR-006' },
];

export function PosProvider({ children }) {
  const [menu, setMenu] = useState(() => {
    const saved = localStorage.getItem('vikings-pos-menu');
    return saved ? JSON.parse(saved) : DEFAULT_MENU;
  });
  const [sales, setSales] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshMenu = async () => {
    try {
      const data = await posApi.getMenu();
      if (Array.isArray(data) && data.length) {
        setMenu(data);
        localStorage.setItem('vikings-pos-menu', JSON.stringify(data));
      }
    } catch {
      // Fallback to local
    }
  };

  const refreshSales = async () => {
    try {
      const data = await posApi.getSales();
      if (Array.isArray(data)) setSales(data);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    refreshMenu();
    refreshSales();
    const timer = setInterval(() => {
      refreshMenu();
      refreshSales();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const changeQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const total = subtotal;

  const checkout = async () => {
    if (!cart.length) throw new Error('Cart is empty.');
    const paid = Number(amountTendered || total);

    const payload = {
      items: cart.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
      paymentMethod,
      amountTendered: paid,
    };

    let receiptId = `VG-${Date.now().toString().slice(-6)}`;
    try {
      const res = await posApi.createSale(payload);
      if (res?.id) receiptId = res.id;
    } catch (err) {
      console.warn('API sale recording failed, fallback to local:', err.message);
    }

    const receipt = {
      id: receiptId,
      date: new Date().toISOString(),
      lines: [...cart],
      total,
      subtotal,
      method: paymentMethod,
      amountTendered: paid,
      change: Math.max(0, paid - total),
      table: 'Walk-in',
    };

    setLastReceipt(receipt);
    setSales((prev) => [receipt, ...prev]);
    clearCart();
    setAmountTendered('');
    return receipt;
  };

  const value = {
    menu,
    refreshMenu,
    sales,
    refreshSales,
    cart,
    addToCart,
    changeQuantity,
    clearCart,
    subtotal,
    total,
    paymentMethod,
    setPaymentMethod,
    amountTendered,
    setAmountTendered,
    checkout,
    lastReceipt,
    loading,
  };

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within PosProvider');
  return context;
};

export default PosContext;

