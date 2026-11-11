import React, { createContext, useContext, useEffect, useState } from 'react';
import authApi from '../services/authApi.js';
import { SESSION_TOKEN_KEY } from '../services/api.js';

const AuthContext = createContext(null);

export const DEMO_PROFILES = {
  owner: {
    id: 1,
    name: 'Michelle Saet (Owner)',
    email: 'owner@vikingsgrill.example',
    role: 'Owner',
    phone: '09170000001',
    demo: false,
  },
  manager: {
    id: 2,
    name: 'Operations Manager',
    email: 'manager@vikingsgrill.example',
    role: 'Manager',
    phone: '09170000002',
    demo: false,
  },
  cashier: {
    id: 3,
    name: 'Lead Cashier',
    email: 'cashier@vikingsgrill.example',
    role: 'cashier',
    phone: '09170000003',
    demo: false,
  },
  kitchen: {
    id: 4,
    name: 'Kitchen Lead',
    email: 'kitchen@vikingsgrill.example',
    role: 'kitchen_staff',
    phone: '09170000004',
    demo: false,
  },
  hr: {
    id: 5,
    name: 'HR Specialist',
    email: 'hr@vikingsgrill.example',
    role: 'hr_staff',
    phone: '09170000005',
    demo: false,
  },
  accounting: {
    id: 6,
    name: 'Accountant',
    email: 'accounting@vikingsgrill.example',
    role: 'accounting_staff',
    phone: '09170000006',
    demo: false,
  },
  customer: {
    id: 7,
    name: 'Juan Dela Cruz',
    email: 'juan@example.ph',
    role: 'customer',
    phone: '09181234567',
    demo: false,
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    authApi.getMe()
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch((err) => {
        console.warn('Session verification fallback:', err.message);
        localStorage.removeItem(SESSION_TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    setError('');
    try {
      const data = await authApi.login({ email, password });
      setUser(data.user);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (userData) => {
    setError('');
    try {
      const data = await authApi.register(userData);
      setUser(data.user);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginAsDemo = (profileKey = 'owner') => {
    const profile = DEMO_PROFILES[profileKey] || DEMO_PROFILES.owner;
    setUser(profile);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignored
    } finally {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
    }
  };

  const value = {
    user,
    setUser,
    loading,
    error,
    login,
    register,
    loginAsDemo,
    logout,
    isAuthenticated: Boolean(user),
    isOwner: user?.role === 'Owner',
    isManager: user?.role === 'Manager' || user?.role === 'Owner' || user?.role === 'management',
    isCashier: user?.role === 'cashier',
    isKitchen: user?.role === 'kitchen_staff',
    isCustomer: user?.role === 'customer',
    isStaff: Boolean(user && user.role !== 'customer'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
