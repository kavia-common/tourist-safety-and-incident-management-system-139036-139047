import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi, Api } from '../../api/ApiContext';

// PUBLIC_INTERFACE
export default function FamilyHome() {
  /** Family: link to tourist accounts (placeholder), subscribe to alerts, see last known location */
  const { t } = useTranslation();
  const { fetchJson } = useApi();
  const [alerts, setAlerts] = useState([]);
  const [email, setEmail] = useState('');
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    Api.listAiEvents(fetchJson, { limit: 10 }).then(setAlerts).catch(() => setAlerts([]));
  }, [fetchJson]);

  const subscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubs((s) => [...s, email]);
    setEmail('');
  };

  return (
    <div className="grid cols-2">
      <div className="card">
        <div className="card-title">{t('family.linkedTourists')}</div>
        <div className="alert-item">
          <div className="alert-dot alert-sev-low" />
          <div className="alert-body">
            <div><strong>John Doe</strong> — #T-00123</div>
            <div className="alert-time">Last seen: —</div>
          </div>
        </div>
        <div className="alert-item">
          <div className="alert-dot alert-sev-low" />
          <div className="alert-body">
            <div><strong>Jane Doe</strong> — #T-00456</div>
            <div className="alert-time">Last seen: —</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t('family.subscribe')}</div>
        <form onSubmit={subscribe}>
          <label className="label">Tourist Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-primary" type="submit">Subscribe</button>
          </div>
        </form>
        <div style={{ marginTop: 12 }}>
          {(subs || []).map((s, i) => <div key={i} className="alert-time">• {s}</div>)}
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t('tourist.alerts')}</div>
        <div className="grid">
          {(alerts || []).map((a, idx) => (
            <div key={idx} className="alert-item">
              <div className="alert-dot alert-sev-med" />
              <div className="alert-body">
                <div><strong>{a.type || 'Event'}</strong></div>
                <div className="alert-time">{a.timestamp || ''}</div>
              </div>
            </div>
          ))}
          {(alerts || []).length === 0 && <div style={{ opacity: 0.7 }}>No alerts.</div>}
        </div>
      </div>
    </div>
  );
}
