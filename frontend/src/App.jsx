import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { authApi } from './services/authApi.js';
import { PosProvider } from './context/PosContext.jsx';
import { InventoryProvider } from './context/InventoryContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

// Auth & Public Pages
import UnifiedAuthPage from './pages/auth/UnifiedAuthPage.jsx';
import CustomerPortal from './pages/CustomerPortal.jsx';

// POS Pages
import POSDashboard from './pages/pos/POSDashboard.jsx';
import OrderProcessing from './pages/pos/OrderProcessing.jsx';
import PaymentProcessing from './pages/pos/PaymentProcessing.jsx';
import ReceiptScreen from './pages/pos/ReceiptScreen.jsx';
import TransactionHistory from './pages/pos/TransactionHistory.jsx';
import SalesReports from './pages/pos/SalesReports.jsx';
import MenuManagement from './pages/pos/MenuManagement.jsx';

// Inventory Pages
import InventoryDashboard from './pages/inventory/InventoryDashboard.jsx';
import InventoryItems from './pages/inventory/InventoryItems.jsx';
import StockLevels from './pages/inventory/StockLevels.jsx';
import StockMovements from './pages/inventory/StockMovements.jsx';
import Suppliers from './pages/inventory/Suppliers.jsx';
import PurchaseOrders from './pages/inventory/PurchaseOrders.jsx';
import LowStockAlerts from './pages/inventory/LowStockAlerts.jsx';
import InventoryReports from './pages/inventory/InventoryReports.jsx';

// Administration
import TeamManagement from './pages/TeamManagement.jsx';

function RoleDefaultRedirect() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'hr_staff') {
      authApi.getSsoToken('jewel')
        .then((res) => {
          if (res?.url) window.location.href = res.url;
          else window.location.href = 'http://localhost:5177/hr/dashboard';
        })
        .catch(() => {
          window.location.href = 'http://localhost:5177/hr/dashboard';
        });
    }
    if (user?.role === 'reservation_staff') {
      authApi.getSsoToken('reservation')
        .then((res) => {
          if (res?.url) window.location.href = res.url;
          else window.location.href = 'http://localhost:5176/staff/reservations';
        })
        .catch(() => {
          window.location.href = 'http://localhost:5176/staff/reservations';
        });
    }
  }, [user]);

  if (user?.role === 'kitchen_staff' || user?.role === 'inventory_staff') {
    return <Navigate to="/inventory/stock-levels" replace />;
  }
  if (user?.role === 'accounting_staff') {
    return <Navigate to="/pos/transactions" replace />;
  }
  if (user?.role === 'reservation_staff') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121212', color: '#fff' }}>
        Redirecting to Reservation & Queue System...
      </div>
    );
  }
  if (user?.role === 'hr_staff') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121212', color: '#fff' }}>
        Redirecting to HR Dashboard...
      </div>
    );
  }
  return <Navigate to="/pos/orders" replace />;
}

export default function App() {
  return (
    <PosProvider>
      <InventoryProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<UnifiedAuthPage />} />

          {/* Customer Self-Service Portal Route */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['customer', 'Owner', 'Manager']}>
                <CustomerPortal />
              </ProtectedRoute>
            }
          />

          {/* Staff & Management Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<RoleDefaultRedirect />} />

            {/* Front of House (POS) Routes */}
            <Route path="/pos/dashboard" element={<POSDashboard />} />
            <Route path="/pos/orders" element={<OrderProcessing />} />
            <Route path="/pos/payment" element={<PaymentProcessing />} />
            <Route path="/pos/receipt" element={<ReceiptScreen />} />
            <Route path="/pos/transactions" element={<TransactionHistory />} />
            <Route path="/pos/sales-reports" element={<SalesReports />} />
            <Route path="/pos/menu" element={<MenuManagement />} />

            {/* Stockroom & Procurement Routes */}
            <Route path="/inventory/dashboard" element={<InventoryDashboard />} />
            <Route path="/inventory/items" element={<InventoryItems />} />
            <Route path="/inventory/stock-levels" element={<StockLevels />} />
            <Route path="/inventory/movements" element={<StockMovements />} />
            <Route path="/inventory/suppliers" element={<Suppliers />} />
            <Route path="/inventory/procurement" element={<PurchaseOrders />} />
            <Route path="/inventory/alerts" element={<LowStockAlerts />} />
            <Route path="/inventory/reports" element={<InventoryReports />} />

            {/* Administration */}
            <Route path="/team" element={<TeamManagement />} />

            {/* Fallback */}
            <Route path="*" element={<RoleDefaultRedirect />} />
          </Route>
        </Routes>
      </InventoryProvider>
    </PosProvider>
  );
}
