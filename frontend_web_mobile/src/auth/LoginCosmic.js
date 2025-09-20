import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * PUBLIC_INTERFACE
 * LoginCosmic: A distinct, modern "Cosmic Energy" styled login page.
 * - Indigo/Pink accent gradient
 * - Minimalist with strong typography
 * - Split layout with brand panel and form panel
 * - Accessible form with labels and descriptions
 */
export default function LoginCosmic() {
  /** Modern cosmic login form wired to existing AuthContext.login */
  const { t } = useTranslation();
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'tourist' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(form);
      if (form.role === 'tourist') nav('/tourist');
      if (form.role === 'authority') nav('/authority');
      if (form.role === 'family') nav('/family');
    } catch (e1) {
      setErr(e1.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cosmic-login">
      <div className="cosmic-panel cosmic-panel--brand" role="img" aria-label="Cosmic Energy gradient">
        <div className="cosmic-brand">
          <div className="cosmic-logo">
            <span className="cosmic-logo-dot" />
            <span className="cosmic-logo-ring" />
          </div>
          <h1 className="cosmic-title">Cosmic Safety</h1>
          <p className="cosmic-tagline">
            Indigo & Pink fusion for a calmer, focused sign-in. Secure access to alerts, dashboards, and digital IDs.
          </p>
          <div className="cosmic-badges">
            <span className="cosmic-badge">AI Alerts</span>
            <span className="cosmic-badge">Digital ID</span>
            <span className="cosmic-badge">Heatmap</span>
          </div>
        </div>
        <div className="cosmic-orb" aria-hidden="true" />
      </div>

      <div className="cosmic-panel cosmic-panel--form">
        <div className="cosmic-form-wrap" aria-live="polite">
          <div className="cosmic-form-head">
            <h2>{t('nav.login')}</h2>
            <p className="cosmic-sub">
              Enter your credentials and select your role. You can switch roles later from the header.
            </p>
          </div>

          <form onSubmit={submit} className="cosmic-form" noValidate>
            <div className="cosmic-field">
              <label className="cosmic-label" htmlFor="email">{t('auth.email')}</label>
              <input
                id="email"
                className="cosmic-input"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="cosmic-field">
              <label className="cosmic-label" htmlFor="password">{t('auth.password')}</label>
              <input
                id="password"
                className="cosmic-input"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="cosmic-field">
              <label className="cosmic-label" htmlFor="role">{t('auth.chooseRole')}</label>
              <div className="cosmic-role-group">
                <select
                  id="role"
                  className="cosmic-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="tourist">{t('roles.tourist')}</option>
                  <option value="authority">{t('roles.authority')}</option>
                  <option value="family">{t('roles.family')}</option>
                </select>
                <span className="cosmic-help">Controls your landing dashboard after login.</span>
              </div>
            </div>

            {err && <div className="cosmic-error" role="alert">{err}</div>}

            <div className="cosmic-actions">
              <button className="cosmic-btn cosmic-btn--primary" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : t('auth.login')}
              </button>
              <Link to="/register" className="cosmic-btn cosmic-btn--ghost">{t('auth.noAccount')}</Link>
            </div>
          </form>

          <div className="cosmic-footnote">
            <div className="cosmic-divider"><span>or</span></div>
            <Link to="/login" className="cosmic-light-link">
              Switch to classic login
            </Link>
          </div>
        </div>

        <style>{COSMIC_STYLES}</style>
      </div>
    </div>
  );
}

/**
 * Inline CSS for the cosmic login page to ensure a distinct, isolated style.
 * Uses indigo (#4F46E5) and pink (#EC4899) accents with a clean, minimalist look.
 */
const COSMIC_STYLES = `
.cosmic-login {
  min-height: 70vh;
  display: grid;
  grid-template-columns: minmax(280px, 1.2fr) minmax(280px, 1fr);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
  background: var(--color-panel, #0b1220);
}

/* Left Brand Panel */
.cosmic-panel--brand {
  position: relative;
  background: radial-gradient(800px 280px at 20% -10%, rgba(79,70,229,0.22), transparent),
              radial-gradient(500px 240px at 110% 70%, rgba(236,72,153,0.18), transparent),
              linear-gradient(180deg, rgba(2,6,23,0.7), rgba(2,6,23,0.35));
  padding: 36px 28px;
  display: grid;
  align-content: center;
  color: #E5E7EB;
}
.cosmic-brand {
  max-width: 520px;
}
.cosmic-logo {
  position: relative;
  width: 56px; height: 56px;
  display: grid; place-items: center;
  margin-bottom: 10px;
}
.cosmic-logo-dot {
  width: 14px; height: 14px; border-radius: 9999px;
  background: radial-gradient(circle at 40% 40%, #fff 0 25%, #EC4899 26% 100%);
  box-shadow: 0 0 18px rgba(236,72,153,0.6), 0 0 26px rgba(79,70,229,0.55) inset;
}
.cosmic-logo-ring {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 2px dashed rgba(79,70,229,0.45);
  animation: spin 12s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.cosmic-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.2px;
}
.cosmic-tagline {
  margin-top: 6px;
  color: #cbd5e1;
}
.cosmic-badges {
  display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;
}
.cosmic-badge {
  border: 1px solid rgba(255,255,255,0.14);
  padding: 4px 10px; border-radius: 9999px; font-size: 12px;
  background: linear-gradient(135deg, rgba(79,70,229,0.25), rgba(236,72,153,0.2));
}
.cosmic-orb {
  position: absolute; right: -60px; bottom: -60px;
  width: 240px; height: 240px; border-radius: 9999px;
  background: radial-gradient(circle at 35% 35%, rgba(236,72,153,0.5), rgba(79,70,229,0.35));
  filter: blur(20px); opacity: 0.8;
}

/* Right Form Panel */
.cosmic-panel--form {
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  display: grid; place-items: center; padding: 20px;
}
.cosmic-form-wrap {
  width: min(520px, 92vw);
  background: linear-gradient(180deg, rgba(17,24,39,0.55), rgba(17,24,39,0.35));
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 24px 72px rgba(0,0,0,0.35);
  border-radius: 16px;
  padding: 20px;
}
.cosmic-form-head h2 {
  margin: 0 0 6px 0;
  font-size: 22px;
}
.cosmic-sub { color: #9CA3AF; margin: 0; }

/* Fields */
.cosmic-field { margin-top: 12px; }
.cosmic-label { display: block; font-size: 13px; color: #9CA3AF; margin-bottom: 6px; }
.cosmic-input, .cosmic-select {
  width: 100%; border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px; padding: 12px 12px;
  background: #0b1220; color: #E5E7EB;
  outline: 2px solid transparent; transition: outline-color .15s ease, box-shadow .15s ease, transform .15s ease;
}
.cosmic-input:focus-visible, .cosmic-select:focus-visible {
  outline-color: #60A5FA;
  box-shadow: 0 0 0 4px rgba(96,165,250,0.15);
}
.cosmic-role-group { display: grid; gap: 6px; }
.cosmic-help { font-size: 12px; color: #94A3B8; }

/* Actions */
.cosmic-actions {
  margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;
}
.cosmic-btn {
  border: none; cursor: pointer; border-radius: 12px; padding: 12px 14px;
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease, color .15s ease;
  outline: 2px solid transparent;
}
.cosmic-btn:hover { transform: translateY(-1px); }
.cosmic-btn:focus-visible { outline-color: #60A5FA; }
.cosmic-btn--primary {
  background: linear-gradient(135deg, #4F46E5, #EC4899);
  color: #fff; box-shadow: 0 12px 30px rgba(79,70,229,0.25);
}
.cosmic-btn--ghost {
  background: rgba(255,255,255,0.06);
  color: #E5E7EB;
}
.cosmic-error {
  margin-top: 8px; color: #EF4444; font-weight: 600;
}

/* Footnote */
.cosmic-footnote { margin-top: 14px; text-align: center; }
.cosmic-divider { position: relative; color: #94A3B8; font-size: 12px; margin: 10px 0; }
.cosmic-divider::before, .cosmic-divider::after {
  content: ""; position: absolute; top: 50%; width: 40%;
  border-top: 1px solid rgba(255,255,255,0.12);
}
.cosmic-divider::before { left: 0; }
.cosmic-divider::after { right: 0; }
.cosmic-light-link { color: #BFDBFE; text-decoration: underline; }

/* Responsive */
@media (max-width: 980px) {
  .cosmic-login { grid-template-columns: 1fr; }
  .cosmic-panel--brand { min-height: 240px; }
}
`;
