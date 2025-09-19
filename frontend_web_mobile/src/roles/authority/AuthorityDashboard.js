import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi, Api } from '../../api/ApiContext';

/**
 * Small helper to simulate realtime by polling.
 */
function usePoll(fn, ms, deps = []) {
  const timer = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try { await fn(); } catch { /* noop */ }
      if (!cancelled) timer.current = setTimeout(tick, ms);
    };
    tick();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

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

  const load = async () => {
    try { setData(await Api.overview(fetchJson)); } catch { /* ignore */ }
  };
  useEffect(() => { load(); }, []); // initial
  usePoll(load, 8000, [fetchJson]); // refresh

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

function ActionButtons({ item, onAcknowledge, onMarkSafe, onRequestInfo }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      <button className="btn btn-secondary" onClick={() => onAcknowledge(item)}>Acknowledge</button>
      <button className="btn btn-primary" onClick={() => onMarkSafe(item)}>Mark Safe</button>
      <button className="btn" style={{ background: 'rgba(236,72,153,0.12)', color: 'var(--color-secondary)' }} onClick={() => onRequestInfo(item)}>Request Info</button>
    </div>
  );
}

function AuthorityEvents({ limit = 20, compact = false }) {
  const { fetchJson } = useApi();
  const [events, setEvents] = useState([]);

  const load = async () => {
    try { setEvents(await Api.listAiEvents(fetchJson, { limit })); } catch { setEvents([]); }
  };
  useEffect(() => { load(); }, [limit]); // first load
  usePoll(load, 6000, [fetchJson, limit]); // poll

  const acknowledge = (e) => {
    // optimistic UI: mark as acknowledged locally
    setEvents((cur) => cur.map((x) => (x === e ? { ...x, acknowledged: true } : x)));
  };
  const markSafe = (e) => {
    setEvents((cur) => cur.map((x) => (x === e ? { ...x, resolved: true } : x)));
  };
  const requestInfo = (e) => {
    const note = prompt('Enter a question to request more info from field unit:');
    if (!note) return;
    setEvents((cur) => cur.map((x) => (x === e ? { ...x, requestedInfo: note } : x)));
  };

  return (
    <div className="grid">
      {(events || []).map((e, idx) => (
        <div key={idx} className="alert-item">
          <div className={`alert-dot ${e.severity === 'high' ? 'alert-sev-high' : e.severity === 'medium' ? 'alert-sev-med' : 'alert-sev-low'}`} />
          <div className="alert-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div><strong>{e.type || 'Event'}</strong> — {e.source || 'AI'}</div>
              <div className="alert-time">{e.timestamp || ''}</div>
            </div>
            <div className="alert-time">
              {e.acknowledged ? 'Acknowledged • ' : ''}
              {e.resolved ? 'Resolved • ' : ''}
              {e.requestedInfo ? `Requested: "${e.requestedInfo}"` : ''}
            </div>
            {!compact && <ActionButtons item={e} onAcknowledge={acknowledge} onMarkSafe={markSafe} onRequestInfo={requestInfo} />}
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

  const load = async () => {
    try { setEvents(await Api.listIotEvents(fetchJson, { limit })); } catch { setEvents([]); }
  };
  useEffect(() => { load(); }, [limit]);
  usePoll(load, 7000, [fetchJson, limit]);

  return (
    <div className="grid">
      {(events || []).map((e, idx) => (
        <div key={idx} className="alert-item">
          <div className="alert-dot alert-sev-low" />
          <div className="alert-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div><strong>{e.type || 'IoT'}</strong> — {e.deviceId || 'device'}</div>
              <div className="alert-time">{e.timestamp || ''}</div>
            </div>
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

  const load = async () => {
    try { setPanics(await Api.listPanic(fetchJson)); } catch { setPanics([]); }
  };
  useEffect(() => { load(); }, []);
  usePoll(load, 5000, [fetchJson]);

  // Actions on incidents
  const acknowledge = (p) => setPanics((cur) => cur.map((x) => (x === p ? { ...x, acknowledged: true } : x)));
  const markSafe = (p) => setPanics((cur) => cur.map((x) => (x === p ? { ...x, status: 'safe' } : x)));
  const requestInfo = (p) => {
    const note = prompt('Ask tourist for more details:');
    if (!note) return;
    setPanics((cur) => cur.map((x) => (x === p ? { ...x, requestedInfo: note } : x)));
  };

  return (
    <div className="grid cols-2">
      <div className="card">
        <div className="card-title">Panic Incidents</div>
        <div className="grid">
          {(panics || []).map((p, idx) => (
            <div key={idx} className="alert-item">
              <div className="alert-dot alert-sev-high" />
              <div className="alert-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div><strong>{p.user?.email || 'Tourist'}</strong> — {p.note || ''}</div>
                  <div className="alert-time">{p.timestamp || ''}</div>
                </div>
                {p.location && <div className="alert-time">📍 {p.location.lat}, {p.location.lng}</div>}
                <div className="alert-time">
                  {p.acknowledged ? 'Acknowledged • ' : ''}
                  {p.status === 'safe' ? 'Marked Safe • ' : ''}
                  {p.requestedInfo ? `Requested: "${p.requestedInfo}"` : ''}
                </div>
                <ActionButtons item={p} onAcknowledge={acknowledge} onMarkSafe={markSafe} onRequestInfo={requestInfo} />
              </div>
            </div>
          ))}
          {(panics || []).length === 0 && <div style={{ opacity: 0.7 }}>No incidents.</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Hotspots Map</div>
        <div className="map-wrap">
          <div style={{ textAlign: 'center' }}>
            <div>🗺️ Incident Hotspots</div>
            <div className="alert-time">Heat overlay placeholder; bubbles scale with incident count.</div>
          </div>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => alert('Refreshing clusters...')}>Refresh Clusters</button>
          <button className="btn btn-primary" onClick={() => alert('Dispatch unit to hotspot #3')}>Dispatch Unit</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Actionable Feed</div>
        <div className="grid">
          {[...panics].slice(0, 5).map((p, i) => (
            <div key={i} className="alert-item">
              <div className="alert-dot alert-sev-med" />
              <div className="alert-body">
                <div><strong>Follow-up</strong> — {p.user?.email || 'Tourist'}</div>
                <div className="alert-time">{p.timestamp || ''}</div>
                <ActionButtons item={p} onAcknowledge={() => acknowledge(p)} onMarkSafe={() => markSafe(p)} onRequestInfo={() => requestInfo(p)} />
              </div>
            </div>
          ))}
          {(!panics || panics.length === 0) && <div style={{ opacity: 0.7 }}>No actionable items.</div>}
        </div>
      </div>
    </div>
  );
}

function Heatmap() {
  const [filter, setFilter] = useState('24h');
  const onApply = () => alert(`Apply heatmap filter: ${filter}`);
  return (
    <div className="card">
      <div className="card-title">Heatmap</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <label className="label" style={{ margin: 0 }}>Time Range</label>
        <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="1h">Last 1h</option>
          <option value="6h">Last 6h</option>
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7d</option>
        </select>
        <button className="btn btn-primary" onClick={onApply}>Apply</button>
      </div>
      <div className="map-wrap">
        <div>🔥 Heatmap placeholder — integrate map heat layer using aggregate by location/time</div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function AuthorityDashboard() {
  /** Authority entry with inner routing (overview, incidents, heatmap) */
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
