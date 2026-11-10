import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ShieldCheck, MapPin, Store } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header style={{
      height: '56px',
      borderBottom: '1px solid #1f1f1f',
      background: '#121212',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#a0a0a0' }}>
          <MapPin size={14} color="#8b0000" />
          <span style={{ color: '#ffffff', fontWeight: 600 }}>Roxas Branch</span>
          <span>·</span>
          <span>Register #1</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '4px 8px',
          borderRadius: '4px',
          background: user?.role === 'Owner' ? '#3d0a0a' : '#1e293b',
          color: user?.role === 'Owner' ? '#ef4444' : '#38bdf8',
          border: `1px solid ${user?.role === 'Owner' ? '#7f1d1d' : '#0369a1'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <ShieldCheck size={12} />
          <span>{user?.role ? user.role.toUpperCase() : 'STAFF'}</span>
        </div>

        <div style={{
          fontSize: '12px',
          color: '#888888',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            display: 'inline-block'
          }}></span>
          <span>System Online</span>
        </div>
      </div>
    </header>
  );
}

