import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#ef4444',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ margin: 0, opacity: 0.8 }}>Verifying VikingsERP session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user.role);
    if (!hasRole && user.role !== 'Owner') {
      return <Navigate to="/pos/orders" replace />;
    }
  }

  return children;
}
