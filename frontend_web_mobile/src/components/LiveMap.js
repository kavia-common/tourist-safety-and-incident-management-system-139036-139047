import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, CircleMarker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApi, Api } from '../api/ApiContext';

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
 * Demo geofence coordinates (rough rectangle around current location fallback).
 * In real app, load from backend via Api.listGeofences
 */
function useDemoGeofences(center) {
  // If center known, craft a rough polygon around it, plus an inner polygon
  const outer = useMemo(() => {
    const c = center?.lat && center?.lng ? [center.lat, center.lng] : [40.7128, -74.0060]; // NYC fallback
    const d = 0.02; // ~2km
    return [
      [c[0] + d, c[1] - d],
      [c[0] + d, c[1] + d],
      [c[0] - d, c[1] + d],
      [c[0] - d, c[1] - d]
    ];
  }, [center]);
  const inner = useMemo(() => {
    const c = center?.lat && center?.lng ? [center.lat, center.lng] : [40.7128, -74.0060];
    const d = 0.008; // inner zone
    return [
      [c[0] + d, c[1] - d/2],
      [c[0] + d/2, c[1] + d],
      [c[0] - d, c[1] + d/2],
      [c[0] - d/2, c[1] - d]
    ];
  }, [center]);
  return { outer, inner };
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
 * LiveMap: Fullscreen interactive map with:
 * - Live user location
 * - Geofence polygons (outer + inner) styled per design notes
 * - POI markers styled per design notes
 * - Visual feedback and logging when entering/exiting geofence
 * - Bottom CTA pill (Start/Stop Tracking)
 */
export default function LiveMap() {
  /** Fullscreen live map with geofencing overlays and Cosmic Energy theme integration */
  const { fetchJson } = useApi();
  const live = useLiveLocation();
  const { outer, inner } = useDemoGeofences(live);
  const pois = useDemoPoi(live);
  const [tracking, setTracking] = useState(true);
  const [inFence, setInFence] = useState(false);
  const lastFenceState = useRef(false);
  const [toast, setToast] = useState(null);

  // Geofence enter/exit detection
  useEffect(() => {
    if (!live?.lat || !live?.lng) return;
    const inside = pointInPolygon([live.lat, live.lng], outer);
    setInFence(inside);
    if (inside !== lastFenceState.current) {
      lastFenceState.current = inside;
      const eventType = inside ? 'enter' : 'exit';
      setToast(inside ? 'Entered geofenced area' : 'Exited geofenced area');
      // Best-effort log to backend
      Api.logGeofenceEvent(fetchJson, {
        geofenceId: 'demo-outer',
        eventType,
        location: { lat: live.lat, lng: live.lng }
      }).catch(() => {});
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [live, outer, fetchJson]);

  // Simple grouping for dense markers to simulate clusters at low zooms
  const simpleClusters = useMemo(() => {
    // bucket by rounding lat/lng according to zoom band (not accessible here), use coarse grid
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

  // Map initial center
  const initialCenter = [live.lat ?? 40.7128, live.lng ?? -74.0060];

  return (
    <div className="live-map-root">
      <MapContainer
        center={initialCenter}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        className="live-map-canvas"
      >
        <TileLayer
          // Light base tiles to match design reference
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Outer geofence */}
        <Polygon
          positions={outer}
          pathOptions={{
            color: 'var(--geofence-stroke, #E6B800)',
            weight: 2,
            fillColor: '#EBD380',
            fillOpacity: 0.55
          }}
          eventHandlers={{
            mouseover: (e) => {
              e.target.setStyle({ weight: 3 });
            },
            mouseout: (e) => {
              e.target.setStyle({ weight: 2 });
            },
            click: () => {
              setToast('Geofence: Demo Outer Area');
            }
          }}
        >
          <Popup>Geofence: Demo Outer Area</Popup>
        </Polygon>

        {/* Inner zone */}
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

      {/* Top-right compact controls (design positioning) */}
      <div className="map-controls" role="toolbar" aria-label="Map controls">
        <button className="control-btn" onClick={() => setToast(inFence ? 'Inside geofence' : 'Outside geofence')}>
          {inFence ? 'Inside' : 'Outside'}
        </button>
        <button className="control-btn" onClick={toggleTracking}>
          {tracking ? 'Pause' : 'Resume'}
        </button>
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

      <style>{LIVE_MAP_STYLES}</style>
    </div>
  );
}

/**
 * Inline styles aligning to design notes and Cosmic Energy shell
 */
const LIVE_MAP_STYLES = `
.live-map-root {
  position: relative;
  width: 100%;
  height: calc(100vh - 150px); /* respect app chrome; fills main surface area */
  border-radius: 12px;
  overflow: hidden;
}
@media (max-width: 920px) {
  .live-map-root { height: calc(100vh - 220px); }
}
.live-map-canvas {
  background: var(--bg-canvas, #F7F7F7);
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

/* Leaflet polygon hover glow approximated through weight; additional glow via filter if needed */
.leaflet-interactive:hover {
  filter: drop-shadow(0 0 0.2rem rgba(230,184,0,0.35));
}
`;
