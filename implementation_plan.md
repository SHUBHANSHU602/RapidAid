# Implementation Plan - RapidAid Frontend

Build a complete, production-quality, high-aesthetic React + Tailwind CSS frontend for **RapidAid** — a real-time AI-powered emergency ambulance dispatch system. The frontend integrates with the backend at `http://localhost:5000` via Axios and Socket.io, with full JWT authentication, Leaflet mapping with smooth vehicle interpolation, role-based workflows (Patient, Driver, Admin), glassmorphism design system (#0F172A dark theme), and robust state management via Zustand.

## User Review Required

> [!IMPORTANT]
> - **Design System & Theme**: Dark-only theme (#0F172A background, #DC2626 primary emergency red, glassmorphism cards with `backdrop-filter: blur(16px)` and translucent borders).
> - **Live + Offline Fallback**: API and Socket client will connect to `http://localhost:5000` with automatic reconnection. In addition, rich client-side fallbacks/simulators will be included so every feature (real-time map movement, LLaMA 3 AI triage suggestion, first-aid checklist, driver location emitter, admin event stream) can be tested and demonstrated end-to-end even if the local backend server is momentarily offline or in standalone test mode.
> - **Full Backend Alignment**: We will also update backend routes to ensure `POST /api/v1/emergency/:id/transition` and `GET /api/v1/emergency` are fully supported for complete end-to-end API compatibility.

---

## Proposed Architecture & Directory Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── index.css                    # Google Fonts Inter, Tailwind directives, custom glassmorphic & scrollbar utilities, animations
    ├── main.jsx                     # Root React mounting with Toast provider and Error Boundary
    ├── App.jsx                      # React Router (Public, Protected, Role-based routes)
    ├── components/
    │   ├── ui/
    │   │   ├── Button.jsx           # Variants (primary red, secondary, outline, ghost, danger) + loading spinner + pulse
    │   │   ├── Badge.jsx            # Severity & tag badges
    │   │   ├── Card.jsx             # Reusable glassmorphic container with glow & hover effects
    │   │   ├── Modal.jsx            # Framer Motion animated modal dialog with backdrop
    │   │   ├── Toast.jsx            # Custom toast notification components
    │   │   ├── Spinner.jsx          # Custom SVG pulse and spinner loaders
    │   │   ├── Skeleton.jsx         # Shimmer skeleton loader for tables, cards, stats
    │   │   └── StatusBadge.jsx      # Color-coded session statuses (INITIATED, ASSIGNED, EN_ROUTE, DELAYED, RESOLVED)
    │   ├── map/
    │   │   ├── TrackingMap.jsx      # Leaflet map with smooth vehicle LERP, custom SVG ambulance icon, patient pulse pin, route polyline
    │   │   ├── FleetMap.jsx         # Admin Leaflet fleet map with color-coded markers (AVAILABLE/BUSY/OFFLINE) & popups
    │   │   └── AmbulanceMarker.jsx  # Interpolated smooth Leaflet marker component
    │   ├── layout/
    │   │   ├── Navbar.jsx           # Brand logo, role badge, socket connection status dot with tooltip, user profile, logout
    │   │   ├── ProtectedRoute.jsx   # Auth guard checking token validity
    │   │   ├── RoleRoute.jsx        # Role-based authorization guard (USER, DRIVER, ADMIN)
    │   │   └── ErrorBoundary.jsx    # React error boundary with retry UI
    │   └── features/
    │       ├── EmergencyTrigger/
    │       │   ├── TriggerButton.jsx # 120px circular SOS button with multi-ring radar pulse animation
    │       │   └── TriggerModal.jsx  # Emergency type pills, severity slider (1-5), symptoms textarea, geolocation fetch
    │       ├── Tracking/
    │       │   ├── ETACard.jsx       # Large countdown timer, live progress bar, driver name, vehicle ID
    │       │   ├── DelayAlert.jsx    # Red warning banner with drift calculations and reassignment notice
    │       │   ├── AICard.jsx        # LLaMA 3 triage suggestion card (patient guidance + prioritized action)
    │       │   ├── FirstAidCard.jsx  # Interactive step-by-step first-aid checklist with checkmarks & warning banners
    │       │   ├── AmbulanceSwapped.jsx # Amber alert banner when reassigned to a closer ambulance
    │       │   ├── DriverDisconnected.jsx # Signal lost warning card with preserved location timer
    │       │   └── EventLog.jsx      # Collapsible real-time timeline/event log accordion
    │       ├── Driver/
    │       │   ├── AssignmentCard.jsx # Urgent assignment card with sound/vibrate alert, emergency details & ETA
    │       │   ├── LocationEmitter.jsx # Live GPS watchPosition emitter with 4s throttle & delta compression indicator
    │       │   └── NavigationCard.jsx # Google Maps deep link & "I'm On My Way" / "Mark as Resolved" modal
    │       └── Admin/
    │           ├── StatsRow.jsx       # 4 live stat cards (Active Sessions, Available Fleet, Delayed Incidents, Resolved Today)
    │           ├── SessionsTable.jsx  # Filterable, sortable real-time sessions table with quick status transitions & view links
    │           ├── DelayedAlertFeed.jsx # Live feed of delay alerts with drift meters
    │           ├── EventFeed.jsx      # Real-time scrolling event log stream
    │           └── QuickActions.jsx   # Seed database, trigger test events, manage users
    ├── pages/
    │   ├── Landing.jsx              # Hero with animated particles/gradient, stats bar, 3-step workflow, 6-feature grid, footer
    │   ├── Login.jsx                # Split screen with animated emergency graphic + glassmorphism login form
    │   ├── Register.jsx             # Split screen with role selector (USER / DRIVER) and validation
    │   ├── PatientDashboard.jsx     # Patient view (No active emergency: SOS button & history table; Active emergency: banner & quick jump)
    │   ├── EmergencyTracking.jsx    # Split view: 40% scrollable real-time telemetry panel + 60% full-height interactive tracking map
    │   ├── DriverDashboard.jsx      # Online/offline toggle, active assignment view, live GPS emitter, status transitions
    │   └── AdminDashboard.jsx       # Comprehensive command center with live fleet map, stats, sessions table, delay alerts, live logs
    ├── store/
    │   ├── authStore.js             # User state, tokens, login/register/logout, auto loadUser from JWT
    │   ├── sessionStore.js          # Active session telemetry, eventLog, past session history, triggerEmergency, transitionSession
    │   ├── socketStore.js           # Socket connection lifecycle, status, latency
    │   ├── driverStore.js           # Driver status (online/offline), current assignment, emitter status, speed, delta logs
    │   └── adminStore.js            # Live session list, fleet data, stats, delay feeds, system events
    ├── services/
    │   ├── api.js                   # Axios instance (baseURL http://localhost:5000), Bearer auth, 401 refresh token interceptor
    │   └── socket.js                # Singleton Socket.io client with auth handshake, room helpers, listener cleanup registry
    ├── hooks/
    │   ├── useSocket.js             # Declarative socket event subscriber with automatic cleanup on unmount
    │   ├── useGeolocation.js        # Browser navigator.geolocation wrapper with high accuracy & watchPosition
    │   └── useAuth.js               # Helper hook for current user, decoded role, and permissions
    └── utils/
        ├── jwt.js                   # jwt-decode wrapper with expiry check and role extraction
        ├── geo.js                   # Haversine distance, coordinate formatting, bearing calculations, LERP interpolation
        └── time.js                  # date-fns formatting, countdown timers, relative timestamps
```

---

## Step-by-Step Implementation Strategy

### 1. Initialize Frontend Vite Project & Dependencies
- Configure `frontend/package.json` with dependencies: `react`, `react-dom`, `react-router-dom`, `axios`, `socket.io-client`, `zustand`, `leaflet`, `react-leaflet`, `framer-motion`, `lucide-react`, `react-hot-toast`, `date-fns`, `jwt-decode`, `tailwindcss`, `@tailwindcss/vite` (or Tailwind v3/v4 + postcss).
- Configure `vite.config.js` to proxy `/api` and `/socket.io` to `http://localhost:5000` for smooth local development.
- Configure `index.html` with Google Fonts (Inter) and Leaflet CSS.
- Configure `index.css` with dark theme palette (#0F172A, #1E293B, #DC2626), custom glassmorphism utilities, scrollbars, glowing rings, and animations.

### 2. Core Services & Utilities
- **`src/utils/jwt.js`**: `decodeToken(token)`, `isTokenExpired(token)`, `getUserRoleFromToken(token)`.
- **`src/utils/geo.js`**: `haversineDistance(lat1, lon1, lat2, lon2)`, `lerp(start, end, t)`, `formatCoordinates(lat, lng)`, `getGoogleMapsNavigationUrl(lat, lng)`.
- **`src/utils/time.js`**: `formatDistanceToNow(date)`, `formatMinutesSeconds(seconds)`, `formatTimestamp(date)`.
- **`src/services/api.js`**: Axios instance configured with `http://localhost:5000`, request interceptor for Bearer token, response interceptor with 401 refresh token queue handling.
- **`src/services/socket.js`**: Reusable singleton Socket.io client configured with `handshake.auth.token`, auto-reconnect, and emit wrappers (`join_session`, `join_as_driver`, `location_update`).
- **`src/hooks/useSocket.js`**: Hook to subscribe to socket events with guaranteed cleanup.
- **`src/hooks/useGeolocation.js`**: Geolocation hook with `getCurrentPosition` and `watchPosition`.

### 3. Zustand Global State Stores
- **`authStore.js`**: `user`, `accessToken`, `refreshToken`, `isLoading`, `login(email, password)`, `register(data)`, `logout()`, `loadUser()`.
- **`sessionStore.js`**: `activeSession`, `sessionHistory`, `etaInfo`, `aiSuggestion`, `firstAid`, `delayAlert`, `driverLocation`, `eventLog`, `triggerEmergency()`, `fetchSession(id)`, `transitionSession()`, `updateDriverLocation()`.
- **`socketStore.js`**: `isConnected`, `connectionStatus`, `connect()`, `disconnect()`.
- **`driverStore.js`**: `isOnline`, `currentAssignment`, `isEmitting`, `lastEmission`, `deltaCompressedCount`, `totalBroadcasts`, `speed`, `toggleOnline()`, `startLocationEmit()`, `stopLocationEmit()`.
- **`adminStore.js`**: `sessions`, `ambulances`, `stats`, `delayedSessions`, `eventLogs`, `loadAll()`, `updateSessionStatus()`.

### 4. UI Design System & Component Primitives
- **`Button.jsx`**: High-aesthetic button with variants (`primary` with red glow, `secondary`, `outline`, `ghost`, `danger`), loading state with spinner, Framer Motion tap animations, pulse option for SOS.
- **`Card.jsx`**: Glassmorphism container with `bg-[#1E293B]/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6`.
- **`Badge.jsx` & `StatusBadge.jsx`**: Color-coded badges for statuses (`INITIATED`, `ASSIGNED`, `EN_ROUTE`, `DELAYED`, `RESOLVED`) and emergency severities (Level 1 to Level 5).
- **`Modal.jsx`**: Animated backdrop and scale-in modal dialog with ESC key and backdrop click handlers.
- **`Toast.jsx`**: Configured `react-hot-toast` with custom dark glassmorphic styling, icons, and auto-dismiss.
- **`Skeleton.jsx` & `Spinner.jsx`**: Premium loading states and pulsing animations.
- **`Navbar.jsx`**: Top navigation with RapidAid logo, live socket status dot with tooltip, role badge, user profile, and quick actions.
- **`ProtectedRoute.jsx` & `RoleRoute.jsx`**: Route guards checking token presence and decoded role.

### 5. Pages Implementation
- **Landing Page (`/`)**: Hero section with dark particle/glow background, bold typography ("Emergency Help. Under 300ms."), dual CTAs, stats bar (`< 300ms Assignment | Real-time GPS | 4-Level Fallback | LLaMA 3 AI`), 3-step interactive timeline, 6-card feature grid, and footer.
- **Login (`/login`) & Register (`/register`)**: Split layout with animated SVG ambulance graphic, role selection pill selector (USER / DRIVER), password visibility toggles, loading spinners, inline validation, and automatic role-based redirect.
- **Patient Dashboard (`/dashboard`)**:
  - State A (No active emergency): 120px circular red SOS button with multi-ring radar pulse, quick info, recent emergency history table with status badges and duration.
  - State B (Active emergency exists): Urgent top alert banner with animated view button and red pulsing border.
  - **Emergency Trigger Modal**: Pill buttons for emergency types (`CARDIAC`, `TRAUMA`, `RESPIRATORY`, `NEUROLOGICAL`, `OTHER`), 1-5 severity slider with descriptive tags, symptom notes, automatic geolocation fetch with fallback picker, submit button with loading state.
- **Active Emergency Tracking (`/emergency/:id`)**:
  - Left panel (40%): Session ID header, animated status badge, ETA Card (large countdown, live progress bar, driver name), Delay Alert banner (drift minutes, reassignment info), AI Suggestion card (LLaMA 3 patient guidance & first-aid action), First Aid Checklist (interactive checkable steps, warnings in red, estimated time), Ambulance Swapped banner, Driver Disconnected card, collapsible Event Log timeline.
  - Right panel (60%): Full-height Leaflet interactive map with custom dark tiles/styling, animated pulse marker for patient, smooth LERP interpolated ambulance marker, route polyline connecting vehicle to patient, floating map controls (center map, zoom).
- **Driver Dashboard (`/driver`)**:
  - State A (Idle): "Online & Ready" status card with pulsing green dot, online/offline toggle switch, today's trips & average ETA metrics.
  - State B (Assigned): Slide-in assignment alert with sound effect, emergency type & severity badge, patient coordinates with Google Maps deep link, "I'm On My Way" status button, live continuous GPS location emitter using `navigator.geolocation.watchPosition`, delta compression statistics (broadcast vs skipped), and "Mark as Resolved" modal with confirmation.
- **Admin Command Center (`/admin`)**:
  - Top stats row: 4 live glassmorphic cards (Active Sessions, Available Ambulances, Delayed Incidents, Resolved Today).
  - Left column: Live Sessions Table with search, status filters (ALL, INITIATED, ASSIGNED, EN_ROUTE, DELAYED, RESOLVED), [View] link, [Transition] status dropdown; Ambulance Fleet Map showing all ambulances with color-coded pins (AVAILABLE, BUSY, OFFLINE) and popups.
  - Right column: Real-time Delayed Sessions Alert Feed with drift meters, Live Event Feed stream with scrolling timestamps, and Quick Actions panel (Seed Database, View Users, Force Status Transition).

### 6. Backend Enhancements for Full Compatibility
- Add `POST /api/v1/emergency/:id/transition` and `GET /api/v1/emergency` in backend controllers/routes to support driver session resolution, admin status transitions, and user session history directly against the backend.

---

## Verification Plan

### Automated Build & Lint Verification
1. `npm run build` in `frontend/` — ensure zero TypeScript/JSX/Vite build errors or bundle issues.
2. Verify all package dependencies are installed and resolved cleanly.

### End-to-End Functional Verification via Browser Subagent
1. **Landing Page**: Navigate to `/`, verify hero typography, animated buttons, stats bar, and interactive steps.
2. **Authentication Flow**: Test Register and Login pages with role redirection (USER → `/dashboard`, DRIVER → `/driver`, ADMIN → `/admin`).
3. **Patient Emergency Trigger**: On `/dashboard`, click SOS button, select emergency type (CARDIAC, Level 5), trigger emergency, and verify navigation to `/emergency/:id`.
4. **Real-time Tracking**: On `/emergency/:id`, verify Leaflet map rendering, patient pin, ambulance marker interpolation, ETA countdown, AI suggestion card, and First Aid checklist.
5. **Driver Workflow**: On `/driver`, test online/offline toggle, simulate assignment, verify continuous location emitter and "Mark as Resolved" flow.
6. **Admin Control Center**: On `/admin`, verify 4 stats cards, live sessions table, fleet map with ambulance markers, delayed feed, event logs, and status transitions.
