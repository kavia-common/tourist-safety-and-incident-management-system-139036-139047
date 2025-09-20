/**
 * Demo data seeding helper.
 * PUBLIC_INTERFACE
 * seedDemoData posts mock AI events, IoT events, panic events, and a digital ID
 * to the running backend so dashboards and lists have content.
 */
import { Api } from './ApiContext';

// PUBLIC_INTERFACE
export async function seedDemoData(fetchJson) {
  /** Seed a representative set of events and records for demo usage. */
  const now = new Date();
  const fmt = (d) => d.toISOString();

  // Ensure bearer token for endpoints that require auth (digital-id, panic, safety)
  if (!localStorage.getItem('accessToken')) {
    localStorage.setItem('accessToken', 'demo-token');
  }

  // 1) Digital ID (auth required)
  try {
    await Api.createDigitalId(fetchJson, {
      fullName: 'Alex Traveler',
      passportNo: 'X12345678',
      nationality: 'Wonderland',
      metadataHash: 'demo-' + Math.random().toString(36).slice(2)
    });
  } catch (e) {
    // Ignore if already exists or backend rejects; demo resilient
  }

  // 2) Panic incidents (auth required)
  const panicPayloads = [
    { note: 'Medical emergency near central plaza', location: { lat: 40.7127, lng: -74.006 }, timestamp: fmt(new Date(now.getTime() - 5 * 60000)) },
    { note: 'Lost child report', location: { lat: 40.7139, lng: -74.007 }, timestamp: fmt(new Date(now.getTime() - 12 * 60000)) },
  ];
  for (const p of panicPayloads) {
    try { await Api.triggerPanic(fetchJson, { note: p.note, location: p.location, timestamp: p.timestamp }); } catch { /* ignore */ }
  }

  // 3) AI events (public list endpoint, assume ingest open in demo)
  const aiEvents = [
    { source: 'vision-model', type: 'crowd_anomaly', payload: { severity: 'high', details: 'Dense crowd movement irregularity' } },
    { source: 'nlp-monitor', type: 'social_risk', payload: { severity: 'medium', details: 'Spike in local posts about traffic diversion' } },
    { source: 'audio-detector', type: 'distress_call', payload: { severity: 'high', details: 'Detected distress keywords' } },
  ];
  for (const ev of aiEvents) {
    try { await fetchJson('/api/ai/events', { method: 'POST', body: JSON.stringify(ev) }); } catch { /* ignore */ }
  }

  // 4) IoT events
  const iotEvents = [
    { deviceId: 'cam-001', type: 'motion', payload: { value: 0.93 } },
    { deviceId: 'ptt-vehicle-21', type: 'unit_status', payload: { status: 'available' } },
    { deviceId: 'env-004', type: 'noise_level', payload: { db: 84 } },
  ];
  for (const ev of iotEvents) {
    try { await fetchJson('/api/iot/events', { method: 'POST', body: JSON.stringify(ev) }); } catch { /* ignore */ }
  }

  // 5) Safety compute (auth)
  try { await Api.computeSafety(fetchJson, { reason: 'seed-demo' }); } catch { /* ignore */ }

  return { ok: true };
}
