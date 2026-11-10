import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  CreditCard,
  History,
  TrendingUp,
  UtensilsCrossed,
  Package,
  Boxes,
  ArrowLeftRight,
  Truck,
  FileCheck,
  AlertTriangle,
  FileSpreadsheet,
  LogOut,
  ExternalLink,
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, isOwner, isManager } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'VG';

  return (
    <aside className="unified-sidebar">
      <div>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-badge">VG</div>
            <div className="brand-text">
              <h1>VIKINGS GRILL</h1>
              <small>Bar · Billiards · KTV</small>
            </div>
          </div>
        </div>

        <div className="sidebar-scroll">
          {/* POS Navigation */}
          <div className="nav-section-title">Front of House (POS)</div>
          {(isOwner || isManager) && (
            <NavLink to="/pos/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={16} />
              <span>POS Dashboard</span>
            </NavLink>
          )}
          <NavLink to="/pos/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ShoppingCart size={16} />
            <span>Order Processing</span>
          </NavLink>
          <NavLink to="/pos/payment" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <CreditCard size={16} />
            <span>Payment Processing</span>
          </NavLink>
          <NavLink to="/pos/receipt" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Receipt size={16} />
            <span>Receipt Screen</span>
          </NavLink>
          {(isOwner || isManager) && (
            <>
              <NavLink to="/pos/transactions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <History size={16} />
                <span>Transaction History</span>
              </NavLink>
              <NavLink to="/pos/sales-reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <TrendingUp size={16} />
                <span>Sales Reports</span>
              </NavLink>
            </>
          )}
          <NavLink to="/pos/menu" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <UtensilsCrossed size={16} />
            <span>Menu Management</span>
          </NavLink>

          {/* Inventory Navigation */}
          <div className="nav-section-title">Stockroom & Procurement</div>
          {(isOwner || isManager) && (
            <NavLink to="/inventory/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Boxes size={16} />
              <span>Inventory Dashboard</span>
            </NavLink>
          )}
          <NavLink to="/inventory/items" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Package size={16} />
            <span>Inventory Items</span>
          </NavLink>
          <NavLink to="/inventory/stock-levels" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Boxes size={16} />
            <span>Stock Levels</span>
          </NavLink>
          <NavLink to="/inventory/movements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ArrowLeftRight size={16} />
            <span>Stock Movements</span>
          </NavLink>
          {(isOwner || isManager) && (
            <>
              <NavLink to="/inventory/suppliers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Truck size={16} />
                <span>Suppliers</span>
              </NavLink>
              <NavLink to="/inventory/procurement" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileCheck size={16} />
                <span>Purchase Orders</span>
              </NavLink>
              <NavLink to="/inventory/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileSpreadsheet size={16} />
                <span>Inventory Reports</span>
              </NavLink>
            </>
          )}
          <NavLink to="/inventory/alerts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <AlertTriangle size={16} />
            <span>Low-Stock Alerts</span>
          </NavLink>

          {/* Companion Module Link */}
          <div className="nav-section-title">Executive Suite</div>
          <a
            href="http://localhost:5175"
            target="_blank"
            rel="noreferrer"
            className="nav-link"
            style={{ opacity: 0.85 }}
          >
            <TrendingUp size={16} />
            <span>RA & KPI Analytics</span>
            <ExternalLink size={12} style={{ marginLeft: 'auto' }} />
          </a>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile-bar">
          <div className="user-info">
            <div className="user-avatar-circle">{initials}</div>
            <div className="user-meta">
              <strong>{user?.name || 'Viking User'}</strong>
              <span>{user?.demo ? 'Demo Mode' : user?.role}</span>
            </div>
          </div>
          <button className="logout-icon-btn" onClick={logout} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

