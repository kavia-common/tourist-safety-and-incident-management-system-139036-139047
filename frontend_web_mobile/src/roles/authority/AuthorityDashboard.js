import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi, Api } from '../../api/ApiContext';

function SectionNav() {
  const { t } = useTranslation();
  const loc = useLocation();
  const links = [
    { to: '/authority', label: t('authority.overview'), exact: true },
    { to: '/authority/incidents', label: t('authority.eventFeed') },
    { to: '/authority/heatmap', label: t('authority.heatmap') },
  ];
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {links.map((l) => (
          <Link key={l.to} to={l.to} className={`btn ${loc.pathname === l.to ? 'btn-primary' : 'btn-secondary'}`}>{l.label}</Link>
        ))}
      </div>
    </div>
  );
}

function Overview() {
  const { t } = useTranslation();
  const { fetchJson } = useApi();
  const [data, setData] = useState(null);
  useEffect(() => {
    Api.overview(fetchJson).then(setData).catch(() => setData(null));
  }, [fetchJson]);
  return (
    <div className="grid cols-3">
      <div className="card">
        <div className="card-title">{t('authority.metrics')}</div>
        <div>Active Tourists: <strong>{data?.activeTourists ?? '—'}</strong></div>
        <div>Open Incidents: <strong>{data?.openIncidents ?? '—'}</strong></div>
        <div>Avg Safety Score: <strong>{data?.avgSafety ?? '—'}</strong></div>
      </div>
      <div className="card">
        <div className="card-title">Recent AI Events</div>
        <AuthorityEvents limit={5} compact />
      </div>
      <div className="card">
        <div className="card-title">IoT Signals</div>
        <AuthorityIot limit={5} />
      </div>
    </div>
  );
}

function AuthorityEvents({ limit = 20, compact = false }) {
  const { fetchJson } = useApi();
  const [events, setEvents] = useState([]);
  useEffect(() => {
    Api.listAiEvents(fetchJson, { limit }).then(setEvents).catch(() => setEvents([]));
  }, [fetchJson, limit]);
  return (
    <div className="grid">
      {(events || []).map((e, idx) => (
        <div key={idx} className="alert-item">
          <div className={`alert-dot ${e.severity === 'high' ? 'alert-sev-high' : e.severity === 'medium' ? 'alert-sev-med' : 'alert-sev-low'}`} />
          <div className="alert-body">
            <div><strong>{e.type || 'Event'}</strong> — {e.source || 'AI'}</div>
            {!compact && <div className="alert-time">{e.timestamp || ''}</div>}
          </div>
        </div>
      ))}
      {(events || []).length === 0 && <div style={{ opacity: 0.7 }}>No events.</div>}
    </div>
  );
}

function AuthorityIot({ limit = 20 }) {
  const { fetchJson } = useApi();
  const [events, setEvents] = useState([]);
  useEffect(() => {
    Api.listIotEvents(fetchJson, { limit }).then(setEvents).catch(() => setEvents([]));
  }, [fetchJson, limit]);
  return (
    <div className="grid">
      {(events || []).map((e, idx) => (
        <div key={idx} className="alert-item">
          <div className="alert-dot alert-sev-low" />
          <div className="alert-body">
            <div><strong>{e.type || 'IoT'}</strong> — {e.deviceId || 'device'}</div>
            <div className="alert-time">{e.timestamp || ''}</div>
          </div>
        </div>
      ))}
      {(events || []).length === 0 && <div style={{ opacity: 0.7 }}>No IoT data.</div>}
    </div>
  );
}

function Incidents() {
  const { fetchJson } = useApi();
  const [panics, setPanics] = useState([]);
  useEffect(() => {
    Api.listPanic(fetchJson).then(setPanics).catch(() => setPanics([]));
  }, [fetchJson]);
  return (
    <div className="card">
      <div className="card-title">Panic Incidents</div>
      <div className="grid">
        {(panics || []).map((p, idx) => (
          <div key={idx} className="alert-item">
            <div className="alert-dot alert-sev-high" />
            <div className="alert-body">
              <div><strong>{p.user?.email || 'Tourist'}</strong> — {p.note || ''}</div>
              <div className="alert-time">{p.timestamp || ''}</div>
              {p.location && <div className="alert-time">📍 {p.location.lat}, {p.location.lng}</div>}
            </div>
          </div>
        ))}
        {(panics || []).length === 0 && <div style={{ opacity: 0.7 }}>No incidents.</div>}
      </div>
    </div>
  );
}

function Heatmap() {
  return (
    <div className="card">
      <div className="card-title">Heatmap</div>
      <div className="map-wrap">
        <div>🔥 Heatmap placeholder — integrate map heat layer using aggregate by location/time</div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function AuthorityDashboard() {
  /** Authority entry with inner routing */
  return (
    <div>
      <SectionNav />
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/heatmap" element={<Heatmap />} />
      </Routes>
    </div>
  );
}
