import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, DEMO_PROFILES } from '../../context/AuthContext.jsx';
import {
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  UtensilsCrossed,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function UnifiedAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginAsDemo, setUser } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('customer');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const redirectAfterLogin = (user) => {
    if (user?.role === 'customer') {
      navigate('/customer', { replace: true });
    } else {
      const from = location.state?.from?.pathname || '/pos/orders';
      navigate(from, { replace: true });
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!loginEmail || !loginPassword) {
      setFormError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(loginEmail, loginPassword);
      setFormSuccess('Authentication successful! Loading dashboard...');
      setTimeout(() => redirectAfterLogin(result.user), 600);
    } catch (err) {
      setFormError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!regName || !regEmail || !regPassword) {
      setFormError('Please provide your name, email, and a password.');
      return;
    }

    if (regPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        role: regRole,
        password: regPassword,
      });

      setFormSuccess('Account created successfully! Welcome to Vikings Grill.');
      setTimeout(() => redirectAfterLogin(result.user), 600);
    } catch (err) {
      setFormError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login Handler (For Defense Panel Presentation)
  const handleQuickDemo = async (profileKey) => {
    const profile = DEMO_PROFILES[profileKey];
    if (!profile) return;

    setLoginEmail(profile.email);
    setLoginPassword('password123');
    setFormError('');
    setFormSuccess(`Signing in as ${profile.name}...`);
    setLoading(true);

    try {
      const result = await login(profile.email, 'password123');
      redirectAfterLogin(result.user);
    } catch {
      // Fallback to local demo profile if server unreachable
      loginAsDemo(profileKey);
      redirectAfterLogin(profile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 45%, #020617 100%)',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1080px',
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.15fr)',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(185, 28, 28, 0.15)',
        overflow: 'hidden',
      }}>
        {/* Left Side: Brand Story & Capabilities */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(153, 27, 27, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ef4444, #991b1b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '22px',
                color: '#ffffff',
                boxShadow: '0 8px 16px rgba(185, 28, 28, 0.4)',
              }}>
                VG
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '0.5px' }}>
                  VIKINGS GRILL
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#fca5a5', fontWeight: 500 }}>
                  Bar · Billiards · KTV — Roxas, Oriental Mindoro
                </p>
              </div>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.12)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '20px',
              color: '#fef08a',
            }}>
              <ShieldCheck size={14} />
              <span>Unified Enterprise ERP Gateway</span>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 14px', lineHeight: 1.3 }}>
              One Single Sign-On for All 9 Integrated Modules
            </h2>

            <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.6, margin: '0 0 28px' }}>
              Seamlessly connects Front-of-House POS, Kitchen Inventory, Table Reservations, HR & Payroll, Financial Accounting, Customer Reviews, and Executive KPI Analytics.
            </p>

            {/* Subsystem checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'POS & Billing with Automated Thermal Receipts', port: ':4000 / :5173' },
                { label: 'Stockroom Inventory & Reorder Formulas', port: ':4000 / :5173' },
                { label: 'Table Reservations & Live Queue Tracking', port: ':4003 / :5176' },
                { label: 'HR Biometrics, Scheduling & Automated Payroll', port: ':4004 / :5177' },
                { label: 'General Ledger, Financial Transactions & Reports', port: ':4004 / :5177' },
                { label: 'Customer Sentiment Reviews & CRM Profiles', port: ':4005 / :5178' },
                { label: 'Business Performance Targets & KPI Analytics', port: ':5001 / :5175' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#e2e8f0' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                    {item.port}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '12px',
            color: '#94a3b8',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>MinSU Bongabong Capstone 2026</span>
            <span>Single Source: vikings_erp</span>
          </div>
        </div>

        {/* Right Side: Interactive Login / Register Form */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(30, 41, 59, 0.7)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setFormError(''); setFormSuccess(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'login' ? '#b91c1c' : 'transparent',
                color: mode === 'login' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setFormError(''); setFormSuccess(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'register' ? '#b91c1c' : 'transparent',
                color: mode === 'register' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <UserPlus size={16} />
              <span>Create Account</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {formError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '13px',
              marginBottom: '20px',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#86efac',
              fontSize: '13px',
              marginBottom: '20px',
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Tab 1: SIGN IN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. owner@vikingsgrill.example"
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 42px',
                      borderRadius: '10px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                    Password
                  </label>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Default: <strong style={{ color: '#fbbf24' }}>password123</strong>
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 42px',
                      borderRadius: '10px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(185, 28, 28, 0.35)',
                  transition: 'opacity 0.2s',
                  opacity: loading ? 0.7 : 1,
                  marginBottom: '26px',
                }}
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to VikingsERP'}</span>
                <ArrowRight size={16} />
              </button>

              {/* Quick Role Demo Selector (For Oral Defense & Evaluation) */}
              <div style={{
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11.5px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: '#94a3b8',
                  letterSpacing: '0.8px',
                  marginBottom: '12px',
                }}>
                  <Sparkles size={14} color="#f59e0b" />
                  <span>Capstone Defense 1-Click Role Switcher</span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '8px',
                }}>
                  {[
                    { key: 'owner', label: '👑 Owner', role: 'Executive' },
                    { key: 'manager', label: '👔 Manager', role: 'Operations' },
                    { key: 'cashier', label: '💳 Cashier', role: 'Front House' },
                    { key: 'kitchen', label: '🍳 Kitchen', role: 'Cook/Grill' },
                    { key: 'hr', label: '👥 HR Staff', role: 'Payroll' },
                    { key: 'accounting', label: '💰 Accountant', role: 'Finance' },
                    { key: 'customer', label: '🍽️ Customer', role: 'Diner' },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      type="button"
                      onClick={() => handleQuickDemo(btn.key)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#cbd5e1',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                        e.currentTarget.style.color = '#cbd5e1';
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{btn.label}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{btn.role}</div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* Tab 2: SIGN UP / REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: '#64748b' }} />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 42px',
                      borderRadius: '8px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: '#64748b' }} />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@example.ph"
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 42px',
                        borderRadius: '8px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Mobile Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: '#64748b' }} />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0917 123 4567"
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 42px',
                        borderRadius: '8px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Account Role Selector */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Register As Role
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value="customer">🍽️ Customer Diner (Table Booking & Reviews)</option>
                  <option value="cashier">💳 Cashier / POS Staff (Order Billing)</option>
                  <option value="kitchen_staff">🍳 Kitchen & Grill Staff</option>
                  <option value="reservation_staff">📅 Front Desk / Reservation Staff</option>
                  <option value="hr_staff">👥 HR Staff (Attendance & Payroll)</option>
                  <option value="accounting_staff">💰 Accounting Staff (Financials)</option>
                  <option value="Staff">👔 General Staff</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: '#64748b' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 42px',
                        borderRadius: '8px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: '#64748b' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 42px',
                        borderRadius: '8px',
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(185, 28, 28, 0.35)',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <span>{loading ? 'Registering Account...' : 'Create Account & Sign In'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
