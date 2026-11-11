import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import authApi from '../services/authApi.js';
import { Users, Shield, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export default function TeamManagement() {
  const { isOwner, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authApi.getUsers();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not load accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, nextRole) => {
    setError('');
    setSuccess('');
    try {
      await authApi.updateUserRole(userId, nextRole);
      setSuccess(`Account role successfully updated to ${nextRole}.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u)),
      );
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not update role.');
    }
  };

  if (!isOwner) {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center', color: '#888' }}>
        <Shield size={48} color="#ef4444" style={{ marginBottom: '12px' }} />
        <h2 style={{ color: '#fff' }}>Owner Access Only</h2>
        <p>Only the restaurant Owner has permission to reassign team account roles.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', margin: '0 0 4px', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={22} color="#ef4444" />
          <span>Team Access & Role Management</span>
        </h1>
        <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
          Manage restaurant staff accounts and assign Manager privileges to trusted personnel.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#3b0d0d', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ padding: '12px', background: '#064e3b', border: '1px solid #059669', color: '#a7f3d0', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
          {success}
        </div>
      )}

      {/* Account Table */}
      <div className="surface" style={{ borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#121212', borderBottom: '1px solid #222', textAlign: 'left', color: '#666', fontSize: '11px' }}>
              <th style={{ padding: '12px 16px' }}>EMPLOYEE NAME</th>
              <th style={{ padding: '12px 16px' }}>EMAIL ADDRESS</th>
              <th style={{ padding: '12px 16px' }}>CURRENT ROLE</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>REASSIGN PRIVILEGE</th>
            </tr>
          </thead>
          <tbody>
            {users.map((acc) => {
              const isSelf = acc.id === currentUser?.id;
              const isUserOwner = acc.role === 'Owner';
              return (
                <tr key={acc.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>
                    {acc.name} {isSelf && <small style={{ color: '#ef4444', marginLeft: '6px' }}>(You)</small>}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#888' }}>{acc.email}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: isUserOwner ? '#450a0a' : acc.role === 'Manager' ? '#172554' : '#1f2937',
                        color: isUserOwner ? '#f87171' : acc.role === 'Manager' ? '#60a5fa' : '#9ca3af',
                      }}
                    >
                      {acc.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {isUserOwner ? (
                      <span style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>Primary Owner</span>
                    ) : (
                      <select
                        value={acc.role}
                        onChange={(e) => handleRoleChange(acc.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          background: '#121212',
                          border: '1px solid #333',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      >
                        <option value="Manager">Manager</option>
                        <option value="Staff">Staff</option>
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
            {!users.length && !loading && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No registered team members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

