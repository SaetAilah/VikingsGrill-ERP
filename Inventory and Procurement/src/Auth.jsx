import React, { useEffect, useState } from 'react';
import { SESSION_TOKEN_KEY } from './auth.js';

const demoMode = import.meta.env.DEV;
const demoUser = {
  id: 0,
  name: 'Viking Grill Demo',
  email: 'demo@vikingsgrill.local',
  role: 'Owner',
  demo: true,
};

export default function AuthGate({ children }) {
  const [token, setToken] = useState(() => demoMode ? null : localStorage.getItem(SESSION_TOKEN_KEY));
  const [user, setUser] = useState(() => demoMode ? demoUser : null);
  const [checking, setChecking] = useState(() => !demoMode && Boolean(localStorage.getItem(SESSION_TOKEN_KEY)));
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (demoMode) return undefined;
    if (!token) {
      setChecking(false);
      return undefined;
    }
    let active = true;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem(SESSION_TOKEN_KEY);
            if (active) setUser(null);
          }
          throw new Error(data.error || 'Could not verify your account.');
        }
        if (active) setUser(data.user);
      })
      .catch((error) => { if (active) setMessage(error.message); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [token]);

  const authenticated = (data) => {
    localStorage.setItem(SESSION_TOKEN_KEY, data.token);
    setMessage('');
    setUser(data.user);
    setToken(data.token);
  };
  const signOut = async () => {
    if (demoMode) return;
    const currentToken = localStorage.getItem(SESSION_TOKEN_KEY);
    try {
      if (currentToken) {
        const response = await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${currentToken}` } });
        if (!response.ok) setMessage('Signed out on this device, but the server could not revoke the session. Please retry when the API is available.');
      }
    } catch {
      setMessage('Signed out on this device, but the server could not revoke the session. Please retry when the API is available.');
    } finally {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
      setToken(null);
    }
  };

  if (demoMode) return typeof children === 'function' ? children({ user: demoUser, onLogout: signOut }) : children;
  if (checking) return <main className="auth-loading"><span className="auth-spinner" />Checking your account…</main>;
  if (!user) return <AuthScreen onAuthenticated={authenticated} message={message} />;
  return typeof children === 'function' ? children({ user, onLogout: signOut }) : children;
}

function AuthScreen({ onAuthenticated, message: sessionMessage }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const signingUp = mode === 'register';

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/auth/${signingUp ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Authentication could not be completed.');
      onAuthenticated(data);
    } catch (error) {
      setMessage(error.message || 'Cannot reach the VikingsERP API. Start the API server and try again.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="auth-page">
    <section className="auth-brand-panel">
      <div className="auth-brand"><span>VG</span><div><b>VIKING GRILL</b><small>BAR · BILLIARDS · KTV</small></div></div>
      <div className="auth-brand-story"><span className="auth-eyebrow"><i /> RESTAURANT OPERATIONS PLATFORM</span><h1>Great service<br /><em>starts behind<br />the scenes.</em></h1><p>One connected workspace for every order, ingredient, delivery, and guest experience.</p><div className="auth-feature-list"><span>01 <b>POINT OF SALE</b></span><span>02 <b>KITCHEN & INVENTORY</b></span><span>03 <b>ONE SHARED SYSTEM</b></span></div></div>
      <span className="auth-brand-foot">ROXAS, ORIENTAL MINDORO <i>·</i> VIKING GRILL</span>
      <div className="auth-decor-plate"><span>VG</span></div>
    </section>
    <section className="auth-form-panel"><div className="auth-form-wrap">
      <span className="auth-mobile-brand"><span className="auth-mobile-mark">VG</span><span><b>VIKING GRILL</b><small>BAR · BILLIARDS · KTV</small></span></span>
      <span className="auth-form-kicker">{signingUp ? 'JOIN YOUR RESTAURANT WORKSPACE' : 'WELCOME BACK TO THE TEAM'}</span>
      <h2>{signingUp ? 'Create your account' : 'Sign in to Viking Grill'}</h2>
      <p className="auth-intro">{signingUp ? 'Set up your account to access restaurant operations.' : 'Sign in to continue to your restaurant workspace.'}</p>
      {(message || sessionMessage) && <div className="auth-error" role="alert">{message || sessionMessage}</div>}
      <form onSubmit={submit} className="auth-form">
        {signingUp && <label>YOUR NAME<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex Santos" required minLength={2} maxLength={80} /></label>}
        <label>EMAIL ADDRESS<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@restaurant.com" required maxLength={190} /></label>
        <label>PASSWORD<input type="password" autoComplete={signingUp ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={signingUp ? 'At least 8 characters' : 'Enter your password'} required minLength={signingUp ? 8 : undefined} maxLength={128} /></label>
        {signingUp && <p className="auth-role-note"><span>ACCOUNT ACCESS</span> The first account becomes Owner. Later accounts start as Staff; only the Owner can assign Manager access.</p>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : signingUp ? 'Create account' : 'Sign in'}<span>→</span></button>
      </form>
      <div className="auth-switch">{signingUp ? 'Already have an account?' : 'New to VikingsERP?'} <button onClick={() => { setMode(signingUp ? 'login' : 'register'); setMessage(''); }}>{signingUp ? 'Sign in' : 'Create account'}</button></div>
      <div className="auth-security"><span>⌑</span> Your account is stored securely in the shared restaurant database.</div>
    </div></section>
  </main>;
}
