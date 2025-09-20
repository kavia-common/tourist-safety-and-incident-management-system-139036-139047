# Cosmic Safety Frontend (Unified Web/Mobile)

A modern, minimalist React app for the Smart Tourist Safety Monitoring & Incident Response System. It unifies Tourist, Authority, and Family experiences with multilingual UI and integrations to backend REST APIs.

## Highlights

- Multi-role flows: tourist, authority, family
- Tourist: digital ID display, real-time alerts feed, panic button modal, location tracking, live map placeholder
- Authority: dashboards (overview metrics), incidents feed (panic list), heatmap placeholder, AI and IoT feeds
- Family: subscribe to alerts, linked tourists and updates
- i18n: EN/ES/FR with easy extension
- Theming: Emergency Response (navy/amber with critical red), high-contrast panels, accessible modals and alerts
- Responsive layout: top nav, sidebar, cards/grids, central live map area
- Starter API layer targeting the provided OpenAPI (auth, digital ID, safety, geofence, panic, AI, IoT, dashboard)

## Setup

1. Copy `.env.example` to `.env` and set:
   - `REACT_APP_API_BASE` to the backend base (e.g. https://...:3001)
   - `REACT_APP_SITE_URL` for auth email redirects if using magic links

2. Install and run:
   - `npm install`
   - `npm start`

3. Visit http://localhost:3000

## Structure

- `src/App.js`: Router, layout shell, role-protected routes
- `src/i18n.js`: Translations (EN/ES/FR)
- `src/api/ApiContext.js`: API provider and helper methods
- `src/auth/*`: Auth context and views (Login/Register with role selection)
- `src/roles/tourist/*`: Tourist experience with panic modal and map placeholder
- `src/roles/authority/*`: Dashboard, incidents, heatmap placeholder, AI/IoT event feeds
- `src/roles/family/*`: Simple tracking and alerts subscription

## Integrations

- Replace placeholders with your map SDK (Leaflet/Mapbox/Google) in `MapPlaceholder`
- Connect to real auth (e.g. Supabase or backend) in `AuthContext.login/register`
- Use server-sent events/websockets for real-time streams (IoT/AI) via new providers

## Accessibility

- Semantic regions, ARIA labels, keyboard-focusable modals/buttons, sufficient contrast

## Theming

Colors and layout variables in `src/App.css` implement the Cosmic Energy style guide with gradients and smooth transitions.
