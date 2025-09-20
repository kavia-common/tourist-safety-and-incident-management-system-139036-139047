import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../api/ApiContext';
import { seedDemoData } from '../api/SeedDemoData';

// PUBLIC_INTERFACE
export default function SeedCard() {
  /** Sidebar card to seed demo data for dashboards and streams. */
  const { t } = useTranslation();
  const { fetchJson } = useApi();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const runSeed = async () => {
    setBusy(true);
    setMsg('');
    try {
      await seedDemoData(fetchJson);
      setMsg('Demo data seeded. Open Dashboards/Incidents.');
    } catch (e) {
      setMsg(e.message || 'Failed to seed demo data.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sidebar-card" aria-live="polite">
      <div className="sidebar-title">Demo Data</div>
      <div className="sidebar-desc">Seed sample incidents, AI/IoT events and a digital ID for demo.</div>
      <button className="btn btn-primary" onClick={runSeed} disabled={busy}>{busy ? 'Seeding…' : 'Seed Demo Data'}</button>
      {msg && <div className="alert-time" style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
