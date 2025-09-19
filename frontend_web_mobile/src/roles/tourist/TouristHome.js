import React, { useEffect, useMemo, useState } from 'react';
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

// PUBLIC_INTERFACE
export default function TouristHome() {
  /** Tourist experience: digital ID, safety, alerts, panic, location tracking */
  const { t } = useTranslation();
  const { fetchJson } = useApi();
  const [ids, setIds] = useState([]);
  const [safety, setSafety] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [panicOpen, setPanicOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Api.myDigitalIds(fetchJson).then(setIds).catch(() => setIds([]));
    Api.mySafety(fetchJson).then(setSafety).catch(() => setSafety(null));
    Api.listAiEvents(fetchJson, { limit: 10 }).then(setAlerts).catch(() => setAlerts([]));
  }, [fetchJson]);

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
          <div style={{ fontSize: 28, color: 'var(--color-success)' }}>●</div>
          <div>
            <div>Score: <strong>{safety.score ?? 'n/a'}</strong></div>
            <div className="alert-time">Updated: {safety.updatedAt || '—'}</div>
          </div>
        </div>
      ) : <div style={{ opacity: 0.7 }}>No score available.</div>}
    </div>
  );

  const alertsCard = (
    <div className="card">
      <div className="card-title">{t('tourist.alerts')}</div>
      <div className="grid">
        {(alerts || []).map((a, idx) => (
          <div key={idx} className="alert-item">
            <div className={`alert-dot ${severityClass(a.severity || 'low')}`} />
            <div className="alert-body">
              <div><strong>{a.type || 'Event'}</strong></div>
              <div className="alert-time">{a.timestamp || ''}</div>
            </div>
          </div>
        ))}
        {(!alerts || alerts.length === 0) && <div style={{ opacity: 0.7 }}>No alerts.</div>}
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
      setPanicOpen(false);
    } catch (e) {
      alert(e.message || 'Failed to send panic');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid cols-2">
      <div className="grid">
        {digitalIdCard}
        {safetyCard}
        {alertsCard}
        <button className="btn btn-primary" onClick={() => setPanicOpen(true)} aria-haspopup="dialog" aria-controls="panic-modal">
          {busy ? '...' : t('tourist.openPanic')}
        </button>
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
