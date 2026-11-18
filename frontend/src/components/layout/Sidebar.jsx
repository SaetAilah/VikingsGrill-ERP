import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import authApi from '../../services/authApi.js';
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
  Users,
  Calendar,
  DollarSign,
  Star,
  ArrowRight,
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, isOwner, isManager } = useAuth();
  const isInventoryStaff = user?.role === 'kitchen_staff' || user?.role === 'inventory_staff';
  const isAccounting = user?.role === 'accounting_staff';

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'VG';

  const handleOpenModule = async (e, target) => {
    e.preventDefault();
    try {
      const res = await authApi.getSsoToken(target);
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
    } catch (err) {
      console.warn(`SSO token acquisition failed for ${target}:`, err);
    }
    const fallbacks = {
      reservation: 'http://localhost:5176/management/dashboard',
      jewel: 'http://localhost:5177/accounting/dashboard',
      accounting: 'http://localhost:5177/accounting/dashboard',
      payroll: 'http://localhost:5177/hr/payroll',
      feedback: 'http://localhost:5178/management/feedback',
      kpi: 'http://localhost:5175',
    };
    window.location.href = fallbacks[target] || 'http://localhost:5173';
  };

  return (
    <aside className="unified-sidebar">
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
          {/* ─── ACCOUNTING & FINANCE NAVIGATION ─── */}
          {isAccounting && (
            <>
              <div className="nav-section-title">POS Reconciliation</div>
              <NavLink to="/pos/transactions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <History size={16} />
                <span>Transaction History</span>
              </NavLink>
              <NavLink to="/pos/sales-reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <TrendingUp size={16} />
                <span>Sales Reports</span>
              </NavLink>

              <div className="nav-section-title">Expense & Procurement Audit</div>
              <NavLink to="/inventory/procurement" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileCheck size={16} />
                <span>Purchase Orders</span>
              </NavLink>
              <NavLink to="/inventory/suppliers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Truck size={16} />
                <span>Suppliers</span>
              </NavLink>
              <NavLink to="/inventory/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileSpreadsheet size={16} />
                <span>Inventory Reports</span>
              </NavLink>
              <NavLink to="/inventory/movements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <ArrowLeftRight size={16} />
                <span>Stock Movements</span>
              </NavLink>

              <div className="nav-section-title">Accounting & Finance</div>
              <a
                href="http://localhost:5177/accounting/dashboard"
                onClick={(e) => handleOpenModule(e, 'accounting')}
                className="nav-link"
                style={{ opacity: 0.95, cursor: 'pointer', color: '#f87171' }}
                title="Open Primary Accounting Dashboard & Financial Statements"
              >
                <DollarSign size={16} />
                <span>Accounting Dashboard</span>
                <ArrowRight size={13} style={{ marginLeft: 'auto', opacity: 0.7 }} />
              </a>
            </>
          )}

          {/* ─── POS NAVIGATION (Hidden from Kitchen & Accounting Staff) ─── */}
          {!isInventoryStaff && !isAccounting && (
            <>
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
            </>
          )}

          {/* ─── INVENTORY NAVIGATION (Kitchen Staff, Owner, Manager) ─── */}
          {!isAccounting && (isOwner || isManager || isInventoryStaff) && (
            <>
              <div className="nav-section-title">
                {isInventoryStaff && !isOwner ? 'Kitchen Inventory' : 'Stockroom & Procurement'}
              </div>
              {(isOwner || isManager) && (
                <NavLink to="/inventory/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Boxes size={16} />
                  <span>Inventory Dashboard</span>
                </NavLink>
              )}
              <NavLink to="/inventory/stock-levels" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Boxes size={16} />
                <span>Stock Levels</span>
              </NavLink>
              <NavLink to="/inventory/items" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Package size={16} />
                <span>Inventory Items</span>
              </NavLink>
              <NavLink to="/inventory/movements" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <ArrowLeftRight size={16} />
                <span>Stock Movements</span>
              </NavLink>
              <NavLink to="/inventory/alerts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <AlertTriangle size={16} />
                <span>Low-Stock Alerts</span>
              </NavLink>
              {/* Dish Availability (Management & Kitchen can toggle availability when ingredients run out) */}
              <NavLink to="/pos/menu" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <UtensilsCrossed size={16} />
                <span>Dish Availability</span>
              </NavLink>

              {/* Kitchen Orders & KDS (placed below Dish Availability) */}
              {isInventoryStaff && !isOwner && !isManager && (
                <>
                  <div className="nav-section-title">Kitchen Orders</div>
                  <a
                    href="http://localhost:5176/kitchen/orders"
                    onClick={(e) => handleOpenModule(e, 'reservation')}
                    className="nav-link"
                    style={{ opacity: 0.95, cursor: 'pointer', color: '#f87171' }}
                    title="Open Live Kitchen Display System (KDS)"
                  >
                    <UtensilsCrossed size={16} />
                    <span>Live Orders & KDS</span>
                    <ArrowRight size={13} style={{ marginLeft: 'auto', opacity: 0.7 }} />
                  </a>
                </>
              )}

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
            </>
          )}

          {/* ─── VIKINGSERP ECOSYSTEM INTEGRATIONS ─── */}
          {!isAccounting && (!isInventoryStaff || isOwner || isManager) && (
            <>
              <div className="nav-section-title">VikingsERP Integrated Modules</div>
              <a
                href="http://localhost:5176"
                onClick={(e) => handleOpenModule(e, 'reservation')}
                className="nav-link"
                style={{ opacity: 0.95, cursor: 'pointer' }}
                title="Single Sign-On into Reservation & Queue"
              >
                <Calendar size={16} />
                <span>Reservation & Queue</span>
                <ArrowRight size={13} style={{ marginLeft: 'auto', opacity: 0.7 }} />
              </a>
            </>
          )}

          {(isOwner || isManager) && (
            <>
              <a
                href="http://localhost:5177"
                onClick={(e) => handleOpenModule(e, 'jewel')}
                className="nav-link"
                style={{ opacity: 0.95, cursor: 'pointer' }}
                title="Single Sign-On into HR & Accounting"
              >
                <DollarSign size={16} />
                <span>HR & Accounting</span>
                <ArrowRight size={13} style={{ marginLeft: 'auto', opacity: 0.7 }} />
              </a>
              <a
                href="http://localhost:5178"
                onClick={(e) => handleOpenModule(e, 'feedback')}
                className="nav-link"
                style={{ opacity: 0.95, cursor: 'pointer' }}
                title="Single Sign-On into Customer Feedback"
              >
                <Star size={16} />
                <span>Customer Feedback</span>
                <ArrowRight size={13} style={{ marginLeft: 'auto', opacity: 0.7 }} />
              </a>
              <a
                href="http://localhost:5175"
                onClick={(e) => handleOpenModule(e, 'kpi')}
                className="nav-link"
                style={{ opacity: 0.95, cursor: 'pointer' }}
                title="Open Reporting & KPI Suite"
              >
                <TrendingUp size={16} />
                <span>Reporting & KPI Suite</span>
                <ArrowRight size={13} style={{ marginLeft: 'auto', opacity: 0.7 }} />
              </a>
            </>
          )}

          {/* Administration (Owner only) */}
          {isOwner && (
            <>
              <div className="nav-section-title">Administration</div>
              <NavLink to="/team" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Users size={16} />
                <span>Team & Role Access</span>
              </NavLink>
            </>
          )}
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

