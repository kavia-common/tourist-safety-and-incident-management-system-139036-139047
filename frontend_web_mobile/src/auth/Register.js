import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// PUBLIC_INTERFACE
export default function Register() {
  /** Registration form for simple demo flow */
  const { t } = useTranslation();
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await register(form);
      if (res?.role === 'tourist') nav('/tourist');
      else if (res?.role === 'authority') nav('/authority');
      else nav('/');
    } catch (e1) {
      setErr(e1.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid cols-2">
      <div className="card" aria-live="polite">
        <div className="card-title">{t('nav.signup')}</div>
        <form onSubmit={submit}>
          <label className="label">{t('auth.email')}</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />

          <label className="label" style={{ marginTop: 8 }}>{t('auth.password')}</label>
          <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />

          <div className="alert-time" style={{ marginTop: 4 }}>
            New accounts default to the Tourist role.
          </div>

          {err && <div style={{ color: 'var(--color-error)', marginTop: 8 }}>{err}</div>}

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? '...' : t('auth.signup')}</button>
            <Link to="/login" className="btn btn-secondary">{t('auth.haveAccount')}</Link>
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
