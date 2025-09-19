import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// PUBLIC_INTERFACE
export default function Login() {
  /** Login form that also chooses role to drive navigation */
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
    <div className="grid cols-2">
      <div className="card" aria-live="polite">
        <div className="card-title">{t('nav.login')}</div>
        <form onSubmit={submit}>
          <label className="label">{t('auth.email')}</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />

          <label className="label" style={{ marginTop: 8 }}>{t('auth.password')}</label>
          <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />

          <label className="label" style={{ marginTop: 8 }}>{t('auth.chooseRole')}</label>
          <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="tourist">{t('roles.tourist')}</option>
            <option value="authority">{t('roles.authority')}</option>
            <option value="family">{t('roles.family')}</option>
          </select>

          {err && <div style={{ color: 'var(--color-error)', marginTop: 8 }}>{err}</div>}

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? '...' : t('auth.login')}</button>
            <Link to="/register" className="btn btn-secondary">{t('auth.noAccount')}</Link>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-title">{t('welcome.title')}</div>
        <div>{t('welcome.desc')}</div>
      </div>
    </div>
  );
}
