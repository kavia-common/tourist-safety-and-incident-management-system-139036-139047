import React, { createContext, useContext, useMemo } from 'react';

/**
 * Simple fetch wrapper with base URL and automatic JSON handling.
 * Reads bearer token from localStorage key 'accessToken' when available.
 */
const ApiContext = createContext({ baseUrl: '', fetchJson: async () => ({}) });

// PUBLIC_INTERFACE
export function ApiProvider({ baseUrl, children }) {
  /** Provide API base and helpers to children */
  const value = useMemo(() => {
    const fetchJson = async (path, options = {}) => {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      };
      const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) return res.json();
      return res.text();
    };
    return { baseUrl, fetchJson };
  }, [baseUrl]);

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

// PUBLIC_INTERFACE
export function useApi() {
  /** Hook to access API helpers */
  return useContext(ApiContext);
}

// PUBLIC_INTERFACE
export const Api = {
  /** High-level API calls aligned with OpenAPI spec */
  // Auth
  async signup(fetchJson, { email, password, metadata }) {
    return fetchJson('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, metadata }) });
  },
  async me(fetchJson) {
    return fetchJson('/api/auth/me', { method: 'GET' });
  },
  // Digital ID
  async createDigitalId(fetchJson, data) {
    return fetchJson('/api/digital-id', { method: 'POST', body: JSON.stringify(data) });
  },
  async myDigitalIds(fetchJson) {
    return fetchJson('/api/digital-id/mine', { method: 'GET' });
  },
  async verifyDigitalId(fetchJson, data) {
    return fetchJson('/api/digital-id/verify', { method: 'POST', body: JSON.stringify(data) });
  },
  // Panic
  async triggerPanic(fetchJson, data) {
    return fetchJson('/api/panic', { method: 'POST', body: JSON.stringify(data) });
  },
  async listPanic(fetchJson) {
    return fetchJson('/api/panic', { method: 'GET' });
  },
  // Safety
  async computeSafety(fetchJson, ctx) {
    return fetchJson('/api/safety/compute', { method: 'POST', body: JSON.stringify(ctx || {}) });
  },
  async mySafety(fetchJson) {
    return fetchJson('/api/safety/me', { method: 'GET' });
  },
  // AI/IoT
  async listAiEvents(fetchJson, { limit } = {}) {
    const q = limit ? `?limit=${encodeURIComponent(limit)}` : '';
    return fetchJson(`/api/ai/events${q}`, { method: 'GET' });
  },
  async listIotEvents(fetchJson, { deviceId, limit } = {}) {
    const params = new URLSearchParams();
    if (deviceId) params.append('deviceId', deviceId);
    if (limit) params.append('limit', String(limit));
    const q = params.toString() ? `?${params.toString()}` : '';
    return fetchJson(`/api/iot/events${q}`, { method: 'GET' });
  },
  // Geofence
  async createGeofence(fetchJson, data) {
    return fetchJson('/api/geofence', { method: 'POST', body: JSON.stringify(data) });
  },
  async listGeofences(fetchJson) {
    return fetchJson('/api/geofence', { method: 'GET' });
  },
  async logGeofenceEvent(fetchJson, data) {
    return fetchJson('/api/geofence/event', { method: 'POST', body: JSON.stringify(data) });
  },
  // Dashboard
  async overview(fetchJson) {
    return fetchJson('/api/dashboard/overview', { method: 'GET' });
  },
};
