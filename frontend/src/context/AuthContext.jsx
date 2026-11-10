import React, { createContext, useContext, useEffect, useState } from 'react';
import authApi from '../services/authApi.js';
import { SESSION_TOKEN_KEY } from '../services/api.js';

const AuthContext = createContext(null);

const DEMO_MODE = import.meta.env.DEV;
const DEMO_USER = {
  id: 0,
  name: 'Viking Operations Demo',
  email: 'admin@vikingsgrill.local',
  role: 'Owner',
  demo: true,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (DEMO_MODE ? DEMO_USER : null));
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
        if (!DEMO_MODE) setUser(null);
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

  const register = async (name, email, password) => {
    setError('');
    try {
      const data = await authApi.register({ name, email, password });
      setUser(data.user);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignored
    } finally {
      setUser(DEMO_MODE ? DEMO_USER : null);
    }
  };

  const value = {
    user,
    setUser,
    loading,
    error,
    login,
    register,
    logout,
    isOwner: user?.role === 'Owner',
    isManager: user?.role === 'Manager' || user?.role === 'Owner',
    isStaff: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;

