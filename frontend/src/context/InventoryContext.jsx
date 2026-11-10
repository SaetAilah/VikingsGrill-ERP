import React, { createContext, useContext, useEffect, useState } from 'react';
import inventoryApi from '../services/inventoryApi.js';

const InventoryContext = createContext(null);

const SEED_ITEMS = [
  { id: 1, sku: 'ING-001', name: 'Pork belly', category: 'Meat & poultry', unit: 'kg', quantity: 18.5, reorder: 10, cost: 285, supplier: 'Mindoro Fresh Meats', type: 'Ingredient' },
  { id: 2, sku: 'ING-002', name: 'Chicken leg quarters', category: 'Meat & poultry', unit: 'kg', quantity: 7.2, reorder: 12, cost: 195, supplier: 'Mindoro Fresh Meats', type: 'Ingredient' },
  { id: 3, sku: 'ING-003', name: 'Jasmine rice', category: 'Dry goods', unit: 'kg', quantity: 42, reorder: 20, cost: 58, supplier: 'Roxas Grain Trading', type: 'Ingredient' },
  { id: 4, sku: 'ING-004', name: 'Cooking oil', category: 'Dry goods', unit: 'L', quantity: 6, reorder: 8, cost: 112, supplier: 'Roxas Grain Trading', type: 'Ingredient' },
  { id: 5, sku: 'ING-005', name: 'Kangkong', category: 'Produce', unit: 'kg', quantity: 3.4, reorder: 5, cost: 65, supplier: 'Bongabong Produce Co.', type: 'Ingredient' },
  { id: 6, sku: 'ING-006', name: 'Coconut milk', category: 'Canned & chilled', unit: 'L', quantity: 11, reorder: 6, cost: 94, supplier: 'Oriental Food Supply', type: 'Ingredient' },
  { id: 7, sku: 'SUP-001', name: 'Takeaway food containers', category: 'Packaging', unit: 'pcs', quantity: 36, reorder: 50, cost: 4.5, supplier: 'Oriental Food Supply', type: 'Supply' },
  { id: 8, sku: 'SUP-002', name: 'Kitchen gloves', category: 'Cleaning & safety', unit: 'box', quantity: 14, reorder: 5, cost: 72, supplier: 'Oriental Food Supply', type: 'Supply' },
];

const SEED_SUPPLIERS = [
  { id: 1, name: 'Mindoro Fresh Meats', contact: '0917 555 0124', email: 'orders@mindorofresh.example', status: 'Active' },
  { id: 2, name: 'Roxas Grain Trading', contact: '0918 345 6677', email: 'sales@roxasgrain.example', status: 'Active' },
  { id: 3, name: 'Bongabong Produce Co.', contact: '0920 111 4088', email: 'produce@bongabong.example', status: 'Active' },
  { id: 4, name: 'Oriental Food Supply', contact: '043 288 9500', email: 'hello@orientalfood.example', status: 'Active' },
];

export function InventoryProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('vikings-inv-items');
    return saved ? JSON.parse(saved) : SEED_ITEMS;
  });
  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('vikings-inv-suppliers');
    return saved ? JSON.parse(saved) : SEED_SUPPLIERS;
  });
  const [movements, setMovements] = useState([]);
  const [orders, setOrders] = useState([]);

  const refreshItems = async () => {
    try {
      const data = await inventoryApi.getItems();
      if (Array.isArray(data) && data.length) {
        setItems(data);
        localStorage.setItem('vikings-inv-items', JSON.stringify(data));
      }
    } catch {
      // Fallback
    }
  };

  const refreshSuppliers = async () => {
    try {
      const data = await inventoryApi.getSuppliers();
      if (Array.isArray(data)) setSuppliers(data);
    } catch {
      // Fallback
    }
  };

  const refreshMovements = async () => {
    try {
      const data = await inventoryApi.getMovements();
      if (Array.isArray(data)) setMovements(data);
    } catch {
      // Fallback
    }
  };

  const refreshOrders = async () => {
    try {
      const data = await inventoryApi.getOrders();
      if (Array.isArray(data)) setOrders(data);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    refreshItems();
    refreshSuppliers();
    refreshMovements();
    refreshOrders();

    const timer = setInterval(() => {
      refreshItems();
      refreshMovements();
      refreshOrders();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const lowStock = items.filter((item) => Number(item.quantity) <= Number(item.reorder));

  const adjustStock = async (id, delta, reason) => {
    try {
      await inventoryApi.recordAdjustment(id, { quantity: delta, reason });
      await refreshItems();
      await refreshMovements();
    } catch {
      // Local fallback
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, Number(i.quantity) + delta) } : i)),
      );
    }
  };

  const value = {
    items,
    refreshItems,
    suppliers,
    refreshSuppliers,
    movements,
    refreshMovements,
    orders,
    refreshOrders,
    lowStock,
    adjustStock,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};

export default InventoryContext;

