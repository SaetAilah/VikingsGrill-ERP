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
  AlertCircle,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

export default function UnifiedAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginAsDemo } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('customer');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Subtle Demo Autofill Dropdown
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const [redirectParam, setRedirectParam] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('redirect');
  });

  const redirectAfterLogin = async (user) => {
    const params = new URLSearchParams(window.location.search);
    const redirectTarget = redirectParam || params.get('redirect');
    const role = user?.role;

    // 1. Front-of-House / Back-of-House roles: ALWAYS land on their respective station
    if (role === 'cashier') {
      navigate('/pos/orders', { replace: true });
      return;
    }
    if (role === 'kitchen_staff' || role === 'inventory_staff') {
      navigate('/inventory/stock-levels', { replace: true });
      return;
    }

    // 2. Customer: land on Customer Portal (or Menu / Feedback if specifically requested)
    if (role === 'customer') {
      if (redirectTarget === 'menu' || redirectTarget === 'queue' || redirectTarget === 'reservation') {
        try {
          const res = await authApi.getSsoToken();
          if (res?.url) { window.location.href = res.url; return; }
        } catch {}
      } else if (redirectTarget === 'feedback' || redirectTarget === 'crm') {
        try {
          const res = await authApi.getSsoToken('feedback');
          if (res?.url) { window.location.href = res.url; return; }
        } catch {}
      }
      navigate('/customer', { replace: true });
      return;
    }

    // 3. HR Staff: always land on Jewel's HR Dashboard (or payroll if requested)
    if (role === 'hr_staff') {
      try {
        const targetType = redirectTarget === 'payroll' ? 'payroll' : 'jewel';
        const res = await authApi.getSsoToken(targetType);
        if (res?.url) {
          window.location.href = res.url;
          return;
        }
      } catch (e) {
        console.warn('SSO redirect failed, fallback:', e);
      }
      window.location.href = 'http://localhost:5177/hr/dashboard';
      return;
    }

    // 4. Accounting Staff: Jewel if requested, otherwise POS Reconciliation
    if (role === 'accounting_staff') {
      if (redirectTarget === 'jewel' || redirectTarget === 'accounting' || redirectTarget === 'payroll') {
        try {
          const res = await authApi.getSsoToken('accounting');
          if (res?.url) { window.location.href = res.url; return; }
        } catch {}
      }
      navigate('/pos/transactions', { replace: true });
      return;
    }

    // 5. Reservation Staff: Reservation module
    if (role === 'reservation_staff') {
      try {
        const res = await authApi.getSsoToken();
        if (res?.url) { window.location.href = res.url; return; }
      } catch {}
      window.location.href = 'http://localhost:5176/staff/reservations';
      return;
    }

    // 6. Owner / Manager / Management (Executive access across all modules)
    if (['Owner', 'Manager', 'management'].includes(role)) {
      if (redirectTarget === 'jewel' || redirectTarget === 'accounting' || redirectTarget === 'payroll') {
        try {
          const targetType = redirectTarget === 'payroll' ? 'payroll' : 'accounting';
          const res = await authApi.getSsoToken(targetType);
          if (res?.url) { window.location.href = res.url; return; }
        } catch {}
      } else if (redirectTarget === 'reservation' || redirectTarget === 'reshallyn' || redirectTarget === 'menu' || redirectTarget === 'queue') {
        try {
          const res = await authApi.getSsoToken();
          if (res?.url) { window.location.href = res.url; return; }
        } catch {}
      } else if (redirectTarget === 'feedback' || redirectTarget === 'crm' || redirectTarget === 'customer_feedback') {
        try {
          const res = await authApi.getSsoToken('feedback');
          if (res?.url) { window.location.href = res.url; return; }
        } catch {}
      }
      const from = location.state?.from?.pathname || '/pos/orders';
      navigate(from, { replace: true });
      return;
    }

    // Default fallback
    const from = location.state?.from?.pathname || '/pos/orders';
    navigate(from, { replace: true });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!loginEmail || !loginPassword) {
      setFormError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(loginEmail, loginPassword);
      setFormSuccess('Signing you in...');
      await redirectAfterLogin(result.user);
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!regName || !regEmail || !regPassword) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (regPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setFormError('Passwords do not match.');
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

      setFormSuccess('Account created successfully!');
      await redirectAfterLogin(result.user);
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || 'Registration failed. Email may already be in use.');
      setLoading(false);
    }
  };

  const handleSelectDemoRole = (profileKey) => {
    const profile = DEMO_PROFILES[profileKey];
    if (!profile) return;
    setLoginEmail(profile.email);
    setLoginPassword('Vikings2026!');
    setFormError('');
    setShowDemoMenu(false);

    // If selecting an ERP role (e.g. cashier, kitchen) while a third-party redirect was in URL, clear redirect
    const role = profile.role;
    const isJewelRole = role === 'hr_staff' || role === 'accounting_staff' || role === 'Owner' || role === 'Manager';
    if (!isJewelRole && redirectParam) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setRedirectParam(null);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#121212',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(139, 26, 26, 0.22) 0%, transparent 60%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      boxSizing: 'border-box',
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '54px',
          height: '54px',
          background: 'linear-gradient(135deg, #8B1A1A, #6B1010)',
          borderRadius: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontFamily: "'Cinzel', Georgia, serif",
          fontWeight: 900,
          fontSize: '24px',
          boxShadow: '0 4px 18px rgba(139, 26, 26, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          marginBottom: '14px',
        }}>
          VG
        </div>
        <h1 style={{
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: '24px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          margin: '0 0 6px',
          color: '#FFFFFF',
          textTransform: 'uppercase',
        }}>
          VIKINGS GRILL
        </h1>
        <p style={{
          margin: 0,
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 600,
          color: '#B03030',
        }}>
          Enterprise Resource Planning
        </p>
      </div>

      {/* Main Authentication Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333333',
        borderRadius: '14px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
        padding: '32px',
        boxSizing: 'border-box',
      }}>
        {/* Redirect Notice Banner */}
        {redirectParam && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(139, 26, 26, 0.15)',
            border: '1px solid rgba(139, 26, 26, 0.35)',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '18px',
            fontSize: '12px',
            color: '#fca5a5',
          }}>
            <span>🔗 Returning to <strong>{redirectParam}</strong> module</span>
            <button
              type="button"
              onClick={() => {
                window.history.replaceState({}, document.title, window.location.pathname);
                setRedirectParam(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '11px',
                textDecoration: 'underline',
                padding: '0 4px',
              }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Tab Toggle (Sign In / Create Account) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: '#141414',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '24px',
          border: '1px solid #282828',
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setFormError(''); setFormSuccess(''); }}
            style={{
              padding: '9px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: mode === 'login' ? '#8B1A1A' : 'transparent',
              color: mode === 'login' ? '#FFFFFF' : '#888888',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setFormError(''); setFormSuccess(''); }}
            style={{
              padding: '9px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: mode === 'register' ? '#8B1A1A' : 'transparent',
              color: mode === 'register' ? '#FFFFFF' : '#888888',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        {formError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(139, 26, 26, 0.2)',
            border: '1px solid rgba(139, 26, 26, 0.4)',
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
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#86efac',
            fontSize: '13px',
            marginBottom: '20px',
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{formSuccess}</span>
          </div>
        )}

        {/* ─── TAB 1: SIGN IN ────────────────────────────────────────── */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#CCCCCC', marginBottom: '7px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#666666' }} />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: '8px',
                    backgroundColor: '#141414',
                    border: '1px solid #333333',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8B1A1A'}
                  onBlur={(e) => e.target.style.borderColor = '#333333'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#CCCCCC' }}>
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#666666' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 40px',
                    borderRadius: '8px',
                    backgroundColor: '#141414',
                    border: '1px solid #333333',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8B1A1A'}
                  onBlur={(e) => e.target.style.borderColor = '#333333'}
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
                    color: '#666666',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', fontSize: '12.5px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888888', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#8B1A1A', cursor: 'pointer' }}
                />
                <span>Remember me</span>
              </label>

              {/* Discreet Demo Autofill Toggle */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowDemoMenu(!showDemoMenu)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#888888',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#CCCCCC'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#888888'}
                >
                  <span>Quick demo account</span>
                  <ChevronDown size={13} />
                </button>

                {showDemoMenu && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '22px',
                    width: '200px',
                    backgroundColor: '#222222',
                    border: '1px solid #3d3d3d',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    zIndex: 50,
                    padding: '4px',
                  }}>
                    {[
                      { key: 'owner', label: 'Owner (Michelle Saet)' },
                      { key: 'manager', label: 'Operations Manager' },
                      { key: 'cashier', label: 'Lead Cashier' },
                      { key: 'kitchen', label: 'Kitchen Lead' },
                      { key: 'hr', label: 'HR Specialist' },
                      { key: 'accounting', label: 'Accountant' },
                      { key: 'customer', label: 'Customer (Juan)' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleSelectDemoRole(item.key)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '5px',
                          backgroundColor: 'transparent',
                          color: '#CCCCCC',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#8B1A1A';
                          e.currentTarget.style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#CCCCCC';
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#8B1A1A',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(139, 26, 26, 0.3)',
                transition: 'background-color 0.15s ease',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#A52A2A'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#8B1A1A'; }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* ─── TAB 2: CREATE ACCOUNT ──────────────────────────────────── */
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#CCCCCC', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: '#666666' }} />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 40px',
                    borderRadius: '8px',
                    backgroundColor: '#141414',
                    border: '1px solid #333333',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8B1A1A'}
                  onBlur={(e) => e.target.style.borderColor = '#333333'}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#CCCCCC', marginBottom: '6px' }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#666666' }} />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '8px',
                      backgroundColor: '#141414',
                      border: '1px solid #333333',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8B1A1A'}
                    onBlur={(e) => e.target.style.borderColor = '#333333'}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#CCCCCC', marginBottom: '6px' }}>
                  Mobile
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#666666' }} />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0917 123 4567"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '8px',
                      backgroundColor: '#141414',
                      border: '1px solid #333333',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8B1A1A'}
                    onBlur={(e) => e.target.style.borderColor = '#333333'}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#CCCCCC', marginBottom: '6px' }}>
                Account Role
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#141414',
                  border: '1px solid #333333',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="customer">Customer Diner</option>
                <option value="cashier">Cashier / POS Staff</option>
                <option value="kitchen_staff">Kitchen Staff</option>
                <option value="reservation_staff">Reservation Staff</option>
                <option value="hr_staff">HR Staff</option>
                <option value="accounting_staff">Accounting Staff</option>
                <option value="Staff">General Staff</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '22px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#CCCCCC', marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#141414',
                    border: '1px solid #333333',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8B1A1A'}
                  onBlur={(e) => e.target.style.borderColor = '#333333'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#CCCCCC', marginBottom: '6px' }}>
                  Confirm
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#141414',
                    border: '1px solid #333333',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8B1A1A'}
                  onBlur={(e) => e.target.style.borderColor = '#333333'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#8B1A1A',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(139, 26, 26, 0.3)',
                transition: 'background-color 0.15s ease',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#A52A2A'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#8B1A1A'; }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>

      {/* Clean Footer */}
      <div style={{
        marginTop: '28px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#888888',
      }}>
        Vikings Grill · Bar · Billiards · KTV — Roxas, Oriental Mindoro
      </div>
    </div>
  );
}
