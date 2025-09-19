import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import './App.css';
import './index.css';
import { useTranslation } from 'react-i18next';
import './i18n';
import { ApiProvider } from './api/ApiContext';
import { useAuth, AuthProvider } from './auth/AuthContext';
import TouristHome from './roles/tourist/TouristHome';
import AuthorityDashboard from './roles/authority/AuthorityDashboard';
import FamilyHome from './roles/family/FamilyHome';
import Login from './auth/Login';
import Register from './auth/Register';

const CosmicTheme = {
  primary: '#4F46E5',
  secondary: '#EC4899',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  success: '#10B981',
  error: '#EF4444',
};

// PUBLIC_INTERFACE
export function AppShell() {
  /** Root shell with top nav, sidebar, and route outlet */
  const { t, i18n } = useTranslation();
  const { user, role, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme] = useState('light');
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const root = document.documentElement.style;
    root.setProperty('--color-primary', CosmicTheme.primary);
    root.setProperty('--color-secondary', CosmicTheme.secondary);
    root.setProperty('--color-bg', CosmicTheme.background);
    root.setProperty('--color-surface', CosmicTheme.surface);
    root.setProperty('--color-text', CosmicTheme.text);
    root.setProperty('--color-success', CosmicTheme.success);
    root.setProperty('--color-error', CosmicTheme.error);
  }, [theme]);

  const routesByRole = useMemo(() => ({
    tourist: [{ to: '/tourist', label: t('nav.touristHome') }],
    authority: [
      { to: '/authority', label: t('nav.dashboard') },
      { to: '/authority/incidents', label: t('nav.incidents') },
      { to: '/authority/heatmap', label: t('nav.heatmap') },
    ],
    family: [{ to: '/family', label: t('nav.familyHome') }],
  }), [t]);

  const currentRoutes = role ? routesByRole[role] : [];

  return (
    <div className="app-root">
      <header className="topnav">
        <div className="brand">
          <span className="logo-dot" />
          <span>Cosmic Safety</span>
        </div>
        <div className="top-actions">
          <select
            aria-label={t('nav.language')}
            className="lang-select"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
          </select>
          {user ? (
            <div className="user-menu">
              <span className="user-pill">{user.email || 'User'}</span>
              <button className="btn btn-secondary" onClick={logout}>{t('nav.logout')}</button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn btn-secondary">{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-primary">{t('nav.signup')}</Link>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(s => !s)} aria-label="Toggle sidebar">☰</button>
        </div>
      </header>

      <div className="content-area">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
          <nav>
            {currentRoutes.map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className={`nav-link ${location.pathname === r.to ? 'active' : ''}`}
              >
                {r.label}
              </Link>
            ))}
          </nav>
          {!user && (
            <div className="sidebar-card">
              <div className="sidebar-title">{t('welcome.title')}</div>
              <div className="sidebar-desc">{t('welcome.desc')}</div>
              <Link to="/login" className="btn btn-primary">{t('nav.getStarted')}</Link>
            </div>
          )}
        </aside>
        <main className="main-surface">
          <Routes>
            <Route path="/" element={<LandingRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/tourist/*" element={<RequireRole role="tourist"><TouristHome /></RequireRole>} />
            <Route path="/authority/*" element={<RequireRole role="authority"><AuthorityDashboard /></RequireRole>} />
            <Route path="/family/*" element={<RequireRole role="family"><FamilyHome /></RequireRole>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <footer className="footer">
        <span>© {new Date().getFullYear()} Cosmic Safety</span>
      </footer>
    </div>
  );
}

// PUBLIC_INTERFACE
function RequireRole({ role, children }) {
  /** Gate access to a route subtree by role */
  const { user, role: currentRole } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (currentRole !== role) return <Navigate to="/" replace />;
  return children;
}

// PUBLIC_INTERFACE
function LandingRedirect() {
  /** Redirect user to role home or login */
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'tourist') return <Navigate to="/tourist" replace />;
  if (role === 'authority') return <Navigate to="/authority" replace />;
  if (role === 'family') return <Navigate to="/family" replace />;
  return <Navigate to="/login" replace />;
}

// PUBLIC_INTERFACE
function App() {
  /** App root that provides API and Auth contexts and router */
  const apiBase = process.env.REACT_APP_API_BASE || 'https://vscode-internal-23023-beta.beta01.cloud.kavia.ai:3001';
  return (
    <ApiProvider baseUrl={apiBase}>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </ApiProvider>
  );
}

export default App;
