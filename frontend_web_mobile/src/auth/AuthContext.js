import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useApi, Api } from '../api/ApiContext';

const AuthContext = createContext({
  user: null,
  role: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  setRole: () => {}
});

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides authenticated user and role state. */
  const { fetchJson } = useApi();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem('role') || null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    Api.me(fetchJson)
      .then(u => setUser(u))
      .catch(() => {
        localStorage.removeItem('accessToken');
        setUser(null);
      });
  }, [fetchJson]);

  const value = useMemo(() => ({
    user,
    role,
    setRole: (r) => {
      setRole(r);
      if (r) localStorage.setItem('role', r); else localStorage.removeItem('role');
    },
    // PUBLIC_INTERFACE
    // login: Hardcoded demo implementation.
    // Accepts ONLY:
    //   1) username: 'user', password: 'user123' => role = 'tourist'
    //   2) username: 'admin', password: 'admin123' => role = 'authority' (admin)
    // Note: "email" field in UI is used as username for this demo. No backend call is made here.
    login: async ({ email, password }) => {
      if (!email || !password) {
        throw new Error('Username and password are required');
      }

      // Normalize input (trim)
      const username = String(email).trim();
      const pwd = String(password).trim();

      let resolvedRole = null;

      if (username === 'user' && pwd === 'user123') {
        resolvedRole = 'tourist';
      } else if (username === 'admin' && pwd === 'admin123') {
        resolvedRole = 'authority';
      } else {
        throw new Error('Invalid credentials. Use user/user123 or admin/admin123');
      }

      // Issue a fake token and set local state
      const fakeToken = `demo-token-${resolvedRole}`;
      localStorage.setItem('accessToken', fakeToken);
      localStorage.setItem('role', resolvedRole);
      setUser({ email: username, role: resolvedRole });
      setRole(resolvedRole);

      // Return a result object so UI can show a clear distinction
      return { ok: true, role: resolvedRole, message: resolvedRole === 'authority' ? 'Logged in as Admin (Authority)' : 'Logged in as Tourist' };
    },
    // PUBLIC_INTERFACE
    register: async ({ email, password }) => {
      /**
       * Registration now always creates a 'user' role (tourist) by default.
       * Role dropdown has been removed from UI and any provided role is ignored.
       */
      const defaultRole = 'tourist';
      await Api.signup(fetchJson, { email, password, metadata: { role: defaultRole } }).catch(() => ({}));
      const fakeToken = `demo-token-${defaultRole}`;
      localStorage.setItem('accessToken', fakeToken);
      localStorage.setItem('role', defaultRole);
      setUser({ email, role: defaultRole });
      setRole(defaultRole);
      return { ok: true, role: defaultRole };
    },
    // PUBLIC_INTERFACE
    logout: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('role');
      setUser(null);
      setRole(null);
    }
  }), [user, role, fetchJson]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook for auth/role state */
  return useContext(AuthContext);
}
