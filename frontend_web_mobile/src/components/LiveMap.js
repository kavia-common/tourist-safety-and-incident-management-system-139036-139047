import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, CircleMarker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApi, Api } from '../api/ApiContext';
import { useAuth } from '../auth/AuthContext';

/**
 * Leaflet default icons fix for CRA builds
 */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

/**
 * Utility: point-in-polygon via ray casting
 */
function pointInPolygon(point, polygon) {
  // polygon: array of [lat, lng]
  const x = point[1], y = point[0];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1], yi = polygon[i][0];
    const xj = polygon[j][1], yj = polygon[j][0];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0000001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Small helper to watch geolocation
 */
function useLiveLocation() {
  const [loc, setLoc] = useState({ lat: null, lng: null, accuracy: null });
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);
  return loc;
}

/**
 * MapEffect to pan to live position when first available
 */
function PanToPosition({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

/**
 * Demo geofence coordinates (initial polygon).
 * Now supports editing, so provide an initial polygon based on center.
 */
function initialOuter(center) {
  const c = center?.lat && center?.lng ? [center.lat, center.lng] : [40.7128, -74.0060];
  const d = 0.02;
  return [
    [c[0] + d, c[1] - d],
    [c[0] + d, c[1] + d],
    [c[0] - d, c[1] + d],
    [c[0] - d, c[1] - d]
  ];
}
function initialInner(center) {
  const c = center?.lat && center?.lng ? [center.lat, center.lng] : [40.7128, -74.0060];
  const d = 0.008;
  return [
    [c[0] + d, c[1] - d/2],
    [c[0] + d/2, c[1] + d],
    [c[0] - d, c[1] + d/2],
    [c[0] - d/2, c[1] - d]
  ];
}

/**
 * Demo POI markers around center
 */
function useDemoPoi(center) {
  return useMemo(() => {
    const points = [];
    const baseLat = center?.lat ?? 40.7128;
    const baseLng = center?.lng ?? -74.0060;
    for (let i = 0; i < 60; i++) {
      const latOffset = (Math.random() - 0.5) * 0.05;
      const lngOffset = (Math.random() - 0.5) * 0.05;
      const dense = Math.random() > 0.7;
      points.push({
        id: `poi-${i}`,
        lat: baseLat + latOffset,
        lng: baseLng + lngOffset,
        dense
      });
    }
    return points;
  }, [center]);
}

/**
 * PUBLIC_INTERFACE
 * LiveMap: Fullscreen interactive map now with:
 * - Live user location
 * - Geofence polygons with entry/exit real-time notifications
 * - Persistent badge indicating inside/outside status
 * - Admin-only edit mode: create/drag/resize/delete geofences (stubbed, local state only)
 * - Save/Cancel editing controls with visual cues
 * - Optional notification log/sidebar for entry/exit events
 */
export default function LiveMap() {
  /** Fullscreen live map with geofencing overlays, alerts, and admin editing tools */
  const { fetchJson } = useApi();
  const { role } = useAuth();
  const isAdmin = role === 'authority'; // admin-only controls
  const live = useLiveLocation();

  // Polygons state (outer + optional inner)
  const [outer, setOuter] = useState(() => initialOuter(live));
  const [inner, setInner] = useState(() => initialInner(live));

  // Editing state
  const [editMode, setEditMode] = useState(false);
  const [draftOuter, setDraftOuter] = useState(null);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [creating, setCreating] = useState(false);

  // Tracking and geofence status
  const [tracking, setTracking] = useState(true);
  const [inFence, setInFence] = useState(false);
  const lastFenceState = useRef(false);
  const [toast, setToast] = useState(null);

  // Notification log (optional sidebar)
  const [log, setLog] = useState([]);

  // Update polygons when live center first appears (if not edited yet)
  useEffect(() => {
    if (outer && inner) return; // already initialized
    setOuter(initialOuter(live));
    setInner(initialInner(live));
  }, [live]); // only runs on first location availability

  // Geofence enter/exit detection with toast + log
  useEffect(() => {
    if (!live?.lat || !live?.lng || !outer) return;
    const inside = pointInPolygon([live.lat, live.lng], outer);
    setInFence(inside);
    if (inside !== lastFenceState.current) {
      lastFenceState.current = inside;
      const eventType = inside ? 'enter' : 'exit';
      const msg = inside ? 'Entered geofenced area' : 'Exited geofenced area';
      setToast(msg);
      setLog((cur) => [{ at: new Date().toISOString(), type: eventType, location: { lat: live.lat, lng: live.lng } }, ...cur].slice(0, 100));
      // Placeholder API call (stubbed)
      Api.logGeofenceEvent(fetchJson, {
        geofenceId: 'demo-outer',
        eventType,
        location: { lat: live.lat, lng: live.lng }
      }).catch(() => {});
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [live, outer, fetchJson]);

  // Simple grouping for dense markers to simulate clusters
  const pois = useDemoPoi(live);
  const simpleClusters = useMemo(() => {
    const grid = new Map();
    for (const p of pois) {
      const key = `${(p.lat*100).toFixed(0)}:${(p.lng*100).toFixed(0)}`;
      const arr = grid.get(key) || [];
      arr.push(p);
      grid.set(key, arr);
    }
    return Array.from(grid.values()).map(group => ({
      lat: group[0].lat,
      lng: group[0].lng,
      size: group.length
    })).filter(g => g.size > 4);
  }, [pois]);

  const ctaLabel = tracking ? 'Stop Tracking' : 'Start Tracking';
  const toggleTracking = useCallback(() => {
    setTracking(t => !t);
    setToast(!tracking ? 'Tracking started' : 'Tracking paused');
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [tracking]);

  // Admin editing helpers
  const startEdit = () => {
    setEditMode(true);
    setDraftOuter(outer ? [...outer] : []);
    setDraggingIdx(null);
    setCreating(false);
    setToast('Edit mode: Drag handles. Add/Del vertices. Save or Cancel.');
    setTimeout(() => setToast(null), 2500);
  };
  const cancelEdit = () => {
    setEditMode(false);
    setDraftOuter(null);
    setDraggingIdx(null);
    setCreating(false);
  };
  const saveEdit = () => {
    if (draftOuter && draftOuter.length >= 3) {
      setOuter(draftOuter);
      // PUBLIC_INTERFACE
      // Backend sync placeholder: replace with real API call:
      // await Api.createGeofence(fetchJson, { name: 'Updated Zone', polygon: geojsonFromLatLngs(draftOuter) })
      // or PATCH/PUT endpoint once available.
      try {
        // Stub: no-op, could call Api.createGeofence in demo
      } catch {}
    }
    setEditMode(false);
    setDraftOuter(null);
    setDraggingIdx(null);
    setCreating(false);
  };
  const deleteFence = () => {
    if (!editMode) return;
    setDraftOuter([]);
  };
  const beginCreate = () => {
    setCreating(true);
    setDraftOuter([]);
  };
  const onCanvasClickAddVertex = (e) => {
    if (!creating || !editMode) return;
    const { latlng } = e;
    setDraftOuter((cur) => [...(cur || []), [latlng.lat, latlng.lng]]);
  };
  // Convert screen drag to vertex move handled via separate small CircleMarker handles
  const onHandleDragStart = (idx) => setDraggingIdx(idx);
  const onHandleDrag = (idx, lat, lng) => {
    setDraftOuter((cur) => {
      if (!cur) return cur;
      const next = [...cur];
      next[idx] = [lat, lng];
      return next;
    });
  };
  const onHandleDragEnd = () => setDraggingIdx(null);
  const addVertexMid = (idx) => {
    if (!draftOuter) return;
    const next = [...draftOuter];
    const a = draftOuter[idx];
    const b = draftOuter[(idx + 1) % draftOuter.length];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    next.splice(idx + 1, 0, mid);
    setDraftOuter(next);
  };
  const removeVertex = (idx) => {
    if (!draftOuter) return;
    if (draftOuter.length <= 3) return; // keep polygon valid
    const next = [...draftOuter];
    next.splice(idx, 1);
    setDraftOuter(next);
  };

  // Map initial center
  const initialCenter = [live.lat ?? 40.7128, live.lng ?? -74.0060];

  // Helper: render polygon handles in edit mode
  const renderHandles = (poly, setPoly) => {
    if (!poly || !editMode) return null;
    return poly.map(([lat, lng], idx) => (
      <CircleMarker
        key={`hdl-${idx}`}
        center={[lat, lng]}
        radius={6}
        pathOptions={{ color: '#1A73E8', weight: 2, fillColor: '#FFFFFF', fillOpacity: 1 }}
        eventHandlers={{
          mousedown: () => onHandleDragStart(idx),
          click: (e) => {
            e.originalEvent.stopPropagation();
          }
        }}
      >
        <Popup>
          <div style={{ display: 'grid', gap: 6 }}>
            <button className="btn btn-secondary" onClick={() => addVertexMid(idx)}>Add Midpoint</button>
            <button className="btn" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }} onClick={() => removeVertex(idx)}>Remove Vertex</button>
          </div>
        </Popup>
      </CircleMarker>
    ));
  };

  // Mouse move handler to drag a vertex when a handle is "held"
  const mapEventsRef = useRef({ onMouseMove: null, onMouseUp: null });

  useEffect(() => {
    // attach document listeners to update vertex while dragging
    const onMove = (ev) => {
      // We can't get latlng from document events; rely on Leaflet container mousemove if needed.
      // This simple implementation defers to handle drag using leaflet's 'mousemove' on MapContainer via eventHandlers below.
    };
    const onUp = () => setDraggingIdx(null);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  // For Leaflet map 'mousemove' events to update dragging vertex
  const onMapMouseMove = (e) => {
    if (draggingIdx == null || !editMode) return;
    onHandleDrag(draggingIdx, e.latlng.lat, e.latlng.lng);
  };

  // Current polygon to display (draft if in edit)
  const displayOuter = editMode ? (draftOuter ?? outer) : outer;

  // Compute badge label and color
  const badge = inFence ? { text: 'Inside Zone', cls: 'badge-safe' } : { text: 'Outside Zone', cls: 'badge-warning' };

  return (
    <div className="live-map-root">
      <MapContainer
        center={initialCenter}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        className="live-map-canvas"
        whenCreated={(map) => {
          // Optional: future hooks
        }}
        eventHandlers={{
          click: onCanvasClickAddVertex,
          mousemove: onMapMouseMove
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Outer geofence */}
        {displayOuter && displayOuter.length >= 3 && (
          <Polygon
            positions={displayOuter}
            pathOptions={{
              color: 'var(--geofence-stroke, #E6B800)',
              weight: editMode ? 3 : 2,
              fillColor: '#EBD380',
              fillOpacity: 0.55
            }}
            eventHandlers={{
              mouseover: (e) => e.target.setStyle({ weight: editMode ? 4 : 3 }),
              mouseout: (e) => e.target.setStyle({ weight: editMode ? 3 : 2 }),
              click: () => {
                if (!editMode) setToast('Geofence: Demo Outer Area');
              }
            }}
          >
            <Popup>Geofence: Demo Outer Area</Popup>
          </Polygon>
        )}

        {/* Inner zone */}
        {inner && inner.length >= 3 && (
          <Polygon
            positions={inner}
            pathOptions={{
              color: 'var(--geofence-inner-stroke, #7AAE55)',
              weight: 2,
              fillColor: 'rgba(159, 207, 131, 0.8)',
              fillOpacity: 0.35
            }}
          >
            <Popup>Sub-zone: Demo Inner Area</Popup>
          </Polygon>
        )}

        {/* Edit handles for vertices */}
        {editMode && displayOuter && renderHandles(displayOuter, setDraftOuter)}

        {/* POIs */}
        {pois.map(p => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={p.dense ? 5 : 4}
            pathOptions={{
              color: 'var(--marker-default-stroke, #6B1F11)',
              weight: 1,
              fillColor: p.dense ? 'var(--marker-dense-fill, #8F2E1C)' : 'var(--marker-default-fill, #B7442A)',
              fillOpacity: 0.95
            }}
          >
            <Popup>POI marker</Popup>
          </CircleMarker>
        ))}

        {/* Simple cluster bubbles */}
        {simpleClusters.map((c, idx) => (
          <Marker key={`cl-${idx}`} position={[c.lat, c.lng]} icon={L.divIcon({
            className: 'cluster-bubble',
            html: `<div class="cluster-pill">${c.size}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })} />
        ))}

        {/* Live position */}
        {live.lat && live.lng && tracking && (
          <>
            <Marker position={[live.lat, live.lng]}>
              <Popup>Your position</Popup>
            </Marker>
            <CircleMarker
              center={[live.lat, live.lng]}
              radius={16}
              pathOptions={{ color: '#1A73E8', weight: 2, fillColor: 'rgba(26,115,232,0.25)', fillOpacity: 0.25 }}
            />
            <PanToPosition lat={live.lat} lng={live.lng} />
          </>
        )}
      </MapContainer>

      {/* Top-left status badge */}
      <div className="map-badge" aria-live="polite">
        <span className={`badge ${badge.cls}`}>◉ {badge.text}</span>
      </div>

      {/* Top-right controls */}
      <div className="map-controls" role="toolbar" aria-label="Map controls">
        <button className="control-btn" onClick={() => setToast(inFence ? 'Inside geofence' : 'Outside geofence')}>
          {inFence ? 'Inside' : 'Outside'}
        </button>
        <button className="control-btn" onClick={toggleTracking}>
          {tracking ? 'Pause' : 'Resume'}
        </button>

        {/* Admin-only edit controls */}
        {isAdmin && !editMode && (
          <button className="control-btn control-accent" onClick={startEdit} title="Enter edit mode">Edit</button>
        )}
        {isAdmin && editMode && (
          <>
            <button className="control-btn control-ghost" onClick={beginCreate} title="Create new polygon">New</button>
            <button className="control-btn control-danger" onClick={deleteFence} title="Delete polygon">Delete</button>
            <button className="control-btn control-success" onClick={saveEdit} title="Save changes">Save</button>
            <button className="control-btn control-ghost" onClick={cancelEdit} title="Cancel editing">Cancel</button>
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <button className="map-cta" onClick={toggleTracking} aria-live="polite">
        {ctaLabel}
      </button>

      {/* Toast */}
      {toast && (
        <div className="map-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}

      {/* Optional notification log/sidebar for demo/testing */}
      <div className="map-log">
        <div className="map-log-head">Geo Events</div>
        <div className="map-log-list">
          {(log || []).slice(0, 12).map((e, idx) => (
            <div key={idx} className="map-log-item">
              <span className={`dot ${e.type === 'enter' ? 'dot-enter' : 'dot-exit'}`} />
              <div className="map-log-body">
                <div className="map-log-title">{e.type === 'enter' ? 'Entered Zone' : 'Exited Zone'}</div>
                <div className="map-log-meta">{e.at}</div>
              </div>
            </div>
          ))}
          {(log || []).length === 0 && <div className="map-log-empty">No events yet.</div>}
        </div>
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div className="map-edit-banner" role="status">
          <span className="edit-dot" /> Editing Geofence — drag white handles to move vertices. Use controls to add/remove points, then Save.
        </div>
      )}

      <style>{LIVE_MAP_STYLES}</style>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * Placeholder utility to convert LatLng[] to GeoJSON Polygon if backend integration is added later.
 */
export function geojsonFromLatLngs(latlngs) {
  /** Convert [ [lat,lng], ... ] to GeoJSON Polygon */
  const ring = latlngs.map(([lat, lng]) => [lng, lat]);
  if (ring.length && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
    ring.push([...ring[0]]);
  }
  return {
    type: 'Polygon',
    coordinates: [ring]
  };
}

/**
 * Inline styles aligning to design notes and Cosmic Energy shell
 * Includes admin editing cues and notification sidebar.
 */
const LIVE_MAP_STYLES = `
.live-map-root {
  position: relative;
  width: 100%;
  height: calc(100vh - 150px);
  border-radius: 12px;
  overflow: hidden;
}
@media (max-width: 920px) {
  .live-map-root { height: calc(100vh - 220px); }
}
.live-map-canvas {
  background: var(--bg-canvas, #F7F7F7);
}

/* Status badge */
.map-badge {
  position: absolute;
  left: 16px;
  top: 16px;
  z-index: 1000;
}

/* Controls */
.map-controls {
  position: absolute;
  right: 16px;
  top: 16px;
  display: grid;
  gap: 8px;
  z-index: 1000;
}
.control-btn {
  min-width: 40px;
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  background: var(--control-bg, #FFFFFF);
  color: var(--control-icon, #4A4A4A);
  box-shadow: var(--control-shadow, 0 2px 8px rgba(0,0,0,0.15));
  border: none;
  cursor: pointer;
}
.control-btn:focus-visible { outline: 2px solid #1A73E8; }
.control-accent { background: linear-gradient(135deg, #4F46E5, #EC4899); color: #fff; }
.control-success { background: rgba(16,185,129,0.15); color: #10B981; }
.control-danger { background: rgba(239,68,68,0.15); color: #EF4444; }
.control-ghost { background: rgba(255,255,255,0.06); color: #111827; }

/* Bottom CTA */
.map-cta {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 16px;
  height: 44px;
  padding: 0 24px;
  border-radius: 28px;
  background: var(--cta-bg, #1A73E8);
  color: var(--cta-text, #FFFFFF);
  border: none;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(26,115,232,0.35);
  cursor: pointer;
  z-index: 1000;
}
.map-cta:hover { background: #1558B4; }
.map-cta:active { background: #0E3E86; box-shadow: 0 4px 10px rgba(26,115,232,0.25); }
.map-cta:focus-visible { outline: 2px solid #60A5FA; }

/* Toast */
.map-toast {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 74px;
  background: #FFFFFF;
  color: #1C1C1C;
  border-radius: 12px;
  padding: 8px 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  z-index: 1000;
  font-size: 14px;
}

/* Cluster pill */
.cluster-bubble .cluster-pill {
  background: var(--cluster-bg, #FFD166);
  color: var(--cluster-text, #5A3B00);
  border: 2px solid var(--cluster-border, #E6B800);
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
  padding: 2px 6px;
}

/* Edit banner */
.map-edit-banner {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(79,70,229,0.15);
  color: #E0E7FF;
  border: 1px solid rgba(79,70,229,0.35);
  border-radius: 10px;
  padding: 6px 10px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  font-size: 13px;
}
.edit-dot { display: inline-block; width: 8px; height: 8px; background: #4F46E5; border-radius: 9999px; margin-right: 6px; }

/* Notification log/sidebar */
.map-log {
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: 240px;
  max-height: 40%;
  background: rgba(255,255,255,0.92);
  color: #111827;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.2);
  overflow: hidden;
  z-index: 1000;
}
.map-log-head {
  padding: 8px 10px;
  font-weight: 700;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  background: linear-gradient(180deg, rgba(79,70,229,0.08), rgba(236,72,153,0.06));
}
.map-log-list { overflow: auto; max-height: calc(40% - 36px); }
.map-log-item { display: flex; gap: 8px; padding: 8px 10px; align-items: center; }
.map-log-item + .map-log-item { border-top: 1px solid rgba(0,0,0,0.06); }
.dot { width: 8px; height: 8px; border-radius: 9999px; }
.dot-enter { background: #10B981; box-shadow: 0 0 8px rgba(16,185,129,0.6); }
.dot-exit { background: #EF4444; box-shadow: 0 0 8px rgba(239,68,68,0.6); }
.map-log-body { flex: 1; }
.map-log-title { font-weight: 600; font-size: 13px; }
.map-log-meta { font-size: 11px; color: #6B7280; }
.map-log-empty { padding: 10px; font-size: 12px; color: #6B7280; }

/* Hover glow */
.leaflet-interactive:hover {
  filter: drop-shadow(0 0 0.2rem rgba(230,184,0,0.35));
}
`;
