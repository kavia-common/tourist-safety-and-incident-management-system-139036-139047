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
    // login: demo/stub implementation connected to UI
    // Validates basic fields; sets a placeholder token and stores role for routing.
    login: async ({ email, password, role: r }) => {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      // In real flow, call backend auth here; we simulate success with a demo token
      const fakeToken = 'demo-token';
      localStorage.setItem('accessToken', fakeToken);
      setUser({ email });
      if (r) {
        localStorage.setItem('role', r);
        setRole(r);
      }
      return true;
    },
    // PUBLIC_INTERFACE
    register: async ({ email, password, role: r }) => {
      await Api.signup(fetchJson, { email, password, metadata: { role: r } });
      const fakeToken = 'demo-token';
      localStorage.setItem('accessToken', fakeToken);
      setUser({ email });
      if (r) {
        localStorage.setItem('role', r);
        setRole(r);
      }
      return true;
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
