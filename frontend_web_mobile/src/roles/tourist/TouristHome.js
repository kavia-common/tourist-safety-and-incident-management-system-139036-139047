import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi, Api } from '../../api/ApiContext';

// Simple map placeholder component
function MapPlaceholder({ lat, lng }) {
  return (
    <div className="map-wrap" role="img" aria-label="Live map">
      {lat && lng ? (
        <div>
          <div>📍 {lat.toFixed(5)}, {lng.toFixed(5)}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Map placeholder - integrate map SDK here</div>
        </div>
      ) : (
        <div>
          <div>🗺️ Live Map</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Location unknown</div>
        </div>
      )}
    </div>
  );
}

function PanicModal({ open, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  useEffect(() => {
    if (!open) setNote('');
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" aria-modal="true" role="dialog" aria-label={t('tourist.panicTitle')}>
      <div className="modal">
        <div className="modal-header">
          <span>{t('tourist.panicTitle')}</span>
          <button className="btn btn-secondary" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p style={{ marginTop: 8 }}>{t('tourist.panicDesc')}</p>
        <label className="label">{t('tourist.note')}</label>
        <textarea className="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>{t('tourist.cancel')}</button>
          <button className="btn btn-primary" onClick={() => onSubmit(note)}>{t('tourist.submit')}</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Local polling hook to keep alerts and safety up-to-date.
 */
function usePoll(fn, ms, deps = []) {
  const timer = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try { await fn(); } catch {/* ignore */}
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

// PUBLIC_INTERFACE
export default function TouristHome() {
  /** Tourist experience: digital ID, safety, alerts, panic, location tracking, feedback/report */
  const { t } = useTranslation();
  const { fetchJson } = useApi();
  const [ids, setIds] = useState([]);
  const [safety, setSafety] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [panicOpen, setPanicOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [feedback, setFeedback] = useState({ type: 'feedback', message: '' });
  const [history, setHistory] = useState([]);

  const loadInitial = async () => {
    try { setIds(await Api.myDigitalIds(fetchJson)); } catch { setIds([]); }
    try { setSafety(await Api.mySafety(fetchJson)); } catch { setSafety(null); }
    try { setAlerts(await Api.listAiEvents(fetchJson, { limit: 10 })); } catch { setAlerts([]); }
  };

  useEffect(() => { loadInitial(); }, []);
  usePoll(async () => {
    try { setSafety(await Api.mySafety(fetchJson)); } catch { /* noop */ }
    try { setAlerts(await Api.listAiEvents(fetchJson, { limit: 10 })); } catch { /* noop */ }
  }, 8000, [fetchJson]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const severityClass = (sev) => sev === 'high' ? 'alert-sev-high' : sev === 'medium' ? 'alert-sev-med' : 'alert-sev-low';

  const digitalIdCard = useMemo(() => (
    <div className="card">
      <div className="card-title">{t('tourist.myDigitalId')}</div>
      {ids && ids.length > 0 ? (
        <div>
          {ids.map((id) => (
            <div key={id.id || id.passportNo} className="alert-item" style={{ alignItems: 'center' }}>
              <div className="alert-dot alert-sev-low" />
              <div className="alert-body">
                <div><strong>{id.fullName || 'Unknown'}</strong></div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Passport: {id.passportNo || '—'} • Nationality: {id.nationality || '—'}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>MetaHash: {(id.metadataHash || '').slice(0, 12)}...</div>
              </div>
            </div>
          ))}
        </div>
      ) : <div style={{ opacity: 0.7 }}>No digital ID yet.</div>}
    </div>
  ), [ids, t]);

  const safetyCard = (
    <div className="card">
      <div className="card-title">{t('tourist.safetyStatus')}</div>
      {safety ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="badge badge-safe" aria-label="Safety OK">
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--color-success)', display: 'inline-block' }} />
            SAFE
          </div>
          <div>
            <div>Score: <strong>{safety.score ?? 'n/a'}</strong></div>
            <div className="alert-time">Updated: {safety.updatedAt || '—'}</div>
          </div>
        </div>
      ) : <div className="badge badge-warning" aria-live="polite">No score available</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={async () => {
          const updated = await Api.computeSafety(fetchJson, { context: 'manual-refresh' }).catch(() => null);
          if (updated) setSafety(updated);
        }}>Recompute</button>
      </div>
    </div>
  );

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return alerts;
    if (filter === 'high') return alerts.filter(a => (a.severity || 'low') === 'high');
    if (filter === 'medium') return alerts.filter(a => (a.severity || 'low') === 'medium');
    if (filter === 'low') return alerts.filter(a => (a.severity || 'low') === 'low');
    return alerts;
  }, [alerts, filter]);

  const alertsCard = (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{t('tourist.alerts')}</span>
        <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 140 }}>
          <option value="all">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div className="grid">
        {(filteredAlerts || []).map((a, idx) => (
          <div key={idx} className="alert-item">
            <div className={`alert-dot ${severityClass(a.severity || 'low')}`} />
            <div className="alert-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div><strong>{a.type || 'Event'}</strong></div>
                <div className="alert-time">{a.timestamp || ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button className="btn btn-secondary" onClick={() => {
                  setHistory((h) => [{ type: 'ack', item: a, at: new Date().toISOString() }, ...h]);
                }}>Acknowledge</button>
                <button className="btn" style={{ background: 'rgba(236,72,153,0.12)', color: 'var(--color-secondary)' }} onClick={() => {
                  const msg = prompt('Provide feedback about this alert (optional):');
                  setHistory((h) => [{ type: 'feedback', item: a, message: msg || '', at: new Date().toISOString() }, ...h]);
                }}>Feedback</button>
              </div>
            </div>
          </div>
        ))}
        {(!filteredAlerts || filteredAlerts.length === 0) && <div style={{ opacity: 0.7 }}>No alerts.</div>}
      </div>
    </div>
  );

  const panic = async (note) => {
    setBusy(true);
    try {
      const payload = {
        note,
        location: (location.lat && location.lng) ? { lat: location.lat, lng: location.lng } : undefined
      };
      await Api.triggerPanic(fetchJson, payload);
      // optimistic: push to history
      setHistory((h) => [{ type: 'panic', item: { note, location }, at: new Date().toISOString() }, ...h]);
      setPanicOpen(false);
    } catch (e) {
      alert(e.message || 'Failed to send panic');
    } finally {
      setBusy(false);
    }
  };

  const submitFeedback = (e) => {
    e.preventDefault();
    if (!feedback.message) return;
    setHistory((h) => [{ type: feedback.type, message: feedback.message, at: new Date().toISOString() }, ...h]);
    setFeedback({ type: 'feedback', message: '' });
    alert('Thanks for your input!');
  };

  return (
    <div className="grid cols-2">
      <div className="grid">
        {digitalIdCard}
        {safetyCard}
        {alertsCard}
        <div className="card">
          <div className="card-title">Report / Feedback</div>
          <form onSubmit={submitFeedback}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select className="select" value={feedback.type} onChange={(e) => setFeedback((f) => ({ ...f, type: e.target.value }))} style={{ maxWidth: 160 }}>
                <option value="feedback">Feedback</option>
                <option value="report">Report Issue</option>
              </select>
              <button className="btn btn-primary" type="submit">Submit</button>
            </div>
            <textarea className="textarea" rows={3} placeholder="Share details to help improve safety..." value={feedback.message} onChange={(e) => setFeedback((f) => ({ ...f, message: e.target.value }))} />
          </form>
        </div>
        <button className="btn btn-primary" onClick={() => setPanicOpen(true)} aria-haspopup="dialog" aria-controls="panic-modal">
          {busy ? '...' : t('tourist.openPanic')}
        </button>
        <div className="card">
          <div className="card-title">My Actions History</div>
          <div className="grid">
            {(history || []).map((h, i) => (
              <div key={i} className="alert-item">
                <div className="alert-dot alert-sev-low" />
                <div className="alert-body">
                  <div><strong>{h.type}</strong> — <span className="alert-time">{h.at}</span></div>
                  {h.message && <div className="alert-time">“{h.message}”</div>}
                  {h.item?.note && <div className="alert-time">Panic note: “{h.item.note}”</div>}
                  {h.item?.location && <div className="alert-time">📍 {h.item.location.lat}, {h.item.location.lng}</div>}
                </div>
              </div>
            ))}
            {(history || []).length === 0 && <div style={{ opacity: 0.7 }}>No actions yet.</div>}
          </div>
        </div>
      </div>
      <div className="grid">
        <div className="card">
          <div className="card-title">{t('tourist.liveMap')}</div>
          <MapPlaceholder lat={location.lat} lng={location.lng} />
        </div>
      </div>
      <PanicModal open={panicOpen} onClose={() => setPanicOpen(false)} onSubmit={panic} />
    </div>
  );
}
