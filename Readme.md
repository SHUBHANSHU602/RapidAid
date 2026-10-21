# RapidAid

**Emergency-dispatch coordination prototype** using React, Express, MongoDB, Redis, BullMQ and Socket.IO.

> **Status: engineering prototype, not an operational emergency service.** Do not rely on RapidAid to request real medical assistance. Use your local emergency number. This repository demonstrates software architecture; it has not been clinically validated or certified for real ambulance dispatch.

RapidAid lets a patient start an emergency session, selects an eligible online ambulance, sends an assignment to the driver, and provides a tracking/chat interface. It also models delay detection, rerouting suggestions, and replacement attempts. AI features and road-traffic ETA calls are optional. There is **no working hospital dispatch webhook**.

## Read this first: the actual architecture

```text
Patient React UI                  Driver React UI
    | HTTP /api/v1                    | HTTP + Socket.IO location_update
    +------------+--------------------+
                 |
           Express API (app.js) -------- Socket.IO (emergencyRoom.js)
                 |                           |
       emergencyController.js          session:ID / driver:ID rooms
                 |                           |
            MongoDB                    Redis pub/sub adapter
       Users / Sessions /                     |
       Ambulances / Hospitals                 |
                 |                           |
       BullMQ emergency-dispatch <----------- Redis
       Queue + Worker                 availability, geo index,
                 |                   location TTL, ETA, reservations
       assignmentService.js
                 |
      Redis GEOSEARCH -> estimated road ETA (Maps or 30 km/h fallback)
                 |
       Redis Lua reservation + conditional Mongo writes
                 |
        ambulance_assigned + driver_assignment socket events
                 |
       BullMQ delay-detection -> fallbackService.js
```

**Where to start reading:** `frontend/src/components/features/emergency/TriggerModal.jsx` → `frontend/src/store/sessionStore.js` → `backend/src/routes/emergencyRoutes.js` → `backend/src/controllers/emergencyController.js` → `backend/src/services/dispatchQueue.js` → `backend/src/workers/dispatch.worker.js` → `backend/src/services/assignmentService.js` → `backend/src/services/ambulanceCache.js` → `backend/src/sockets/emergencyRoom.js`.

### What happens when a patient presses SOS

1. `POST /api/v1/emergency/trigger` authenticates the patient and validates coordinates/emergency type.
2. The API creates an `INITIATED` `EmergencySession` in MongoDB. A partial unique index prevents a patient from having multiple simultaneously active sessions.
3. It registers a recurring BullMQ dispatch job **before** returning HTTP 201. **201 means SOS recorded/queued, not ambulance assigned.** If registration fails, the controller attempts to remove the newly created session.
4. The worker periodically reads pending sessions, searches nearby eligible ambulances via Redis `GEOSEARCH`, asks for ETAs (Google Maps when configured, otherwise a distance/speed estimate), and ranks candidates.
5. A Redis Lua script temporarily claims an available online ambulance; conditional MongoDB updates attempt to commit its assignment and transition the session to `ASSIGNED`. Redis and MongoDB are **not a single distributed transaction**. Partial-write and crash scenarios require reconciliation.
6. The server emits `ambulance_assigned` to `session:<id>` and `driver_assignment` to `driver:<userId>`. **Socket events are notifications**, not permanent records. Clients should re-fetch session state after reconnecting.
7. The driver begins the trip (`EN_ROUTE`) and sends GPS; location, online eligibility and ETA are cached in Redis, and location may also be persisted to MongoDB.
8. The delay BullMQ worker checks for ETA drift or lack of movement; fallback can suggest a navigation refresh, attempt a replacement ambulance, or send an informational AI message.

### Ownership of state

| Responsibility | Store | Example |
|---|---|---|
| Durable user/driver identity and hashed refresh-token state | MongoDB `User` | role, password hash |
| Durable emergency lifecycle, owner, assigned ambulance and audit events | MongoDB `EmergencySession` | `INITIATED`, `ASSIGNED`, `EN_ROUTE`, `DELAYED`, `RESOLVED`, `CANCELLED` |
| Durable ambulance status, driver and last known GPS | MongoDB `Ambulance` | `assignedSessionId`, `currentLocation` |
| Fleet spatial lookup, online availability, short-lived GPS/ETA and reservation leases | Redis | `ambulance:positions`, `ambulance:available`, `ambulance:<id>:location` |
| Persisted dispatch and delay jobs | BullMQ on Redis | `emergency-dispatch`, `delay-detection` |
| WebSocket room fan-out | Socket.IO + Redis adapter | `session:<id>`, `driver:<id>` |

The database session is the durable record; live Redis values are an optimization and must be reconciled after interruptions. **Do not infer production safety from one successful demo.**

### Assignment decisions and limitations

- Only drivers reported online **and** ambulances reported available with recently refreshed GPS should enter scoring. Redis GEOSEARCH uses a 15 km radius then expands to 30 km if the first search returns none.
- The current score weights ETA (50%), straight-line distance (30%), and reported ping age (20%), normalized by hardcoded scale factors. It is a heuristic, not a proven optimal dispatch policy.
- The ranking uses a subset of geographically nearest candidates. Road-network ETA can make a farther ambulance faster; this is a known design trade-off.
- Google Maps values can fall back to Haversine distance at an assumed 30 km/h. Those are estimates, **not guaranteed arrival times**.
- The design has multiple race-sensitive paths: cancellation versus assignment, replacement versus original driver movement, and Redis versus MongoDB failure. PR #32 adds a reconciliation worker; verify its merge and run fault-injection tests before treating the recovery claim as verified.
- No verified sub-300 ms SLA exists. The HTTP SOS acknowledgment, ambulance selection, external Maps response and Socket.IO notification are **different latency measurements**.

## Project layout

```text
backend/
  app.js                         Express middleware, REST routes, health and metrics
  server.js                      MongoDB connection, Redis sync, HTTP/Socket.IO startup, recovery
  src/models/                    User, Ambulance, Hospital, EmergencySession
  src/routes/                    Auth, ambulances, emergency, hospitals, analytics
  src/controllers/               HTTP request handlers
  src/services/
    ambulanceCache.js            Redis fleet eligibility / GEOSEARCH / GPS cache
    assignmentService.js         Candidate scoring and conditional ambulance assignment
    dispatchQueue.js             Durable dispatch scheduler and pending-session recovery
    fallbackService.js           Delay response and replacement attempts
    mapsService.js               Google Maps ETA with 30 km/h estimate fallback
    metrics.js                   HTTP metrics exported in Prometheus text format
    ai/                          Optional triage, first aid, hospital ranking, driver reply helpers
  src/workers/
    dispatch.worker.js           BullMQ dispatch + asynchronous assistance jobs
    delayDetection.worker.js     BullMQ delay checks
    mapsQueue.worker.js          Legacy/auxiliary queue (not core dispatch path)
  src/sockets/emergencyRoom.js   JWT socket auth, rooms, GPS events and ETA updates
  src/__tests__/                 Jest/Supertest integration and concurrent assignment tests
frontend/src/
  pages/                         PatientDashboard, DriverDashboard, EmergencyTracking
  store/                         Zustand auth, driver and session stores
  services/                      Axios client and Socket.IO client
  components/                    Tracking map, emergency trigger, driver actions and chat
infra/observability/             Local Prometheus, Grafana datasource, example alert rules
```

## Run locally

**Requirements:** Node.js 22, npm, MongoDB and Redis. Google Maps and Groq are optional; without them the project uses fallback behavior. You need local backend/frontend environment files. Real browser GPS and two-device testing require HTTPS or localhost/secure origin.

```bash
git clone https://github.com/SHUBHANSHU602/RapidAid.git
cd RapidAid/backend
npm ci
cp .env.example .env
```

Configure `backend/.env` with:

```dotenv
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/rapidaid_local
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=<random-long-secret>
JWT_REFRESH_SECRET=<different-random-long-secret>
CLIENT_URL=http://localhost:5173
DEMO_MODE=false
GOOGLE_MAPS_API_KEY=
GROQ_API_KEY=
METRICS_TOKEN=<random-private-metrics-secret>
```

Do not commit real credentials. Create unique secrets, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

```bash
# Terminal A, from backend/
npm run dev

# Terminal B, from RapidAid/frontend/
npm ci
```

Create `frontend/.env.local`:

```dotenv
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

```bash
npm run dev
```

Open `http://localhost:5173`. `GET http://localhost:5000/api/v1/health` reports Mongo/Redis connection status; `/internal/live` is liveness and `/internal/ready` checks dependencies.

### Accounts and data

- Public registration creates **patient `USER`** accounts, never `ADMIN` or `DRIVER`.
- An existing admin provisions drivers using `POST /api/v1/auth/drivers`. A driver can provision an ambulance through `POST /api/v1/ambulances/me/provision`.
- **Never run the seed script on a shared/production database.** It intentionally deletes some accounts/ambulances/hospitals and requires `ALLOW_DEMO_SEED=true` plus an accepted local/test/demo Mongo URI. Demo credentials are for isolated development only.
- The app is not an emergency-service integration: seeded hospital information and simulated driver locations are not verified live providers.

## REST API (prefix `/api/v1`)

| Method | Route | Meaning |
|---|---|---|
| POST | `/auth/register` | Register patient |
| POST | `/auth/login` | Access + refresh tokens |
| POST | `/auth/refresh-token` | Rotate refresh token |
| POST | `/auth/logout` | Revoke refresh token (authenticated) |
| GET | `/auth/me` | Current user |
| POST | `/auth/drivers` | Admin-only driver provisioning |
| POST | `/emergency/trigger` | Persist/queue an SOS (201 != assigned) |
| GET | `/emergency/:id` | Authorized session snapshot |
| GET | `/emergency` | Visible sessions, role-scoped |
| POST | `/emergency/:id/transition` | Authorized lifecycle transition |
| POST | `/emergency/:id/cancel` | Cancel emergency |
| POST | `/emergency/:id/arrive` | Driver arrival confirmation |
| POST | `/emergency/:id/generate-otp` | Restricted arrival OTP generation |
| POST / GET | `/emergency/:id/chat` | Authorized chat messages |
| POST | `/emergency/:id/get-route` | Route for assigned driver |
| POST | `/emergency/:id/driver-replies` | Optional driver AI replies |
| GET | `/ambulances/me` | Driver's ambulance |
| POST | `/ambulances/me/provision` | Driver ambulance setup/online |
| GET | `/ambulances/me/active-session` | Recover driver's assignment |
| PATCH | `/ambulances/:id/status` | Status endpoint |
| GET | `/hospitals` | Active hospital records |
| GET | `/analytics/overview` | Admin analytics |

See `backend/src/routes/` for the complete route list and the controllers for payload/permission rules. The frontend Axios client prefixes routes with `/api/v1`; **do not prefix that twice** when configuring `VITE_API_URL`.

**Example SOS request** (with a legitimate patient JWT):

```bash
curl -X POST http://localhost:5000/api/v1/emergency/trigger \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lat":25.3176,"lng":82.9739,"emergencyType":"ACCIDENT","severityLevel":3,"description":"Demo request"}'
```

Expected response: 201 with an emergency `sessionId`, initial `INITIATED` status and general information. Assignment happens asynchronously.

### Socket.IO contract

The Socket.IO server authenticates JWTs during handshake. Typical client events: `join_session`, `join_as_driver`, `location_update`. Server events include `ambulance_assigned`, `driver_assignment`, `driver_location`, `eta_update`, `session_status_changed`, `delay_cleared`, `ambulance_swapped`. See `frontend/src/hooks/useSocket.js` and `backend/src/sockets/emergencyRoom.js` for exact payloads. Reconnect and room rejoin are important to test.

## Test and inspect

```bash
cd backend
npm ci
NODE_ENV=test MONGO_URI=mongodb://127.0.0.1:27017/rapidaid_test REDIS_URL=redis://127.0.0.1:6379 npm test
cd ../frontend
npm ci
npm run build
```

Tests require a dedicated Mongo database and Redis instance. Set JWT secrets as in `.github/workflows/demo-ready-ci.yml`. Existing CI covers auth, sessions, optional AI fallback and competing ambulance assignment. It **does not** establish complete failure safety, real-world GPS behavior or performance SLAs. See `DEMO_GUIDE.md` for an operator-friendly walkthrough.

**Never run `npm run benchmark` on shared data.** The benchmark is intended for an isolated fixture environment, requires `ALLOW_BENCHMARK=true`, and reports only diagnostic results with a small sample. See its source and PR #33.

## Monitoring and operational work

- `GET /internal/live`: process liveness.
- `GET /internal/ready`: checks MongoDB and Redis availability.
- `GET /internal/metrics`: requires `Authorization: Bearer <METRICS_TOKEN>`; per-process HTTP counters, latency histograms and memory/uptime gauges.
- `infra/observability/`: local Prometheus and Grafana configuration and example alert rules. Start with `infra/observability/README.md`. Rules do **not** send notifications without Alertmanager and routing configuration.
- Logs use request correlation IDs and structured events. The provided metrics do not yet measure every business SLI (dispatch outcomes, swap recovery or queue age).

## What is implemented vs. what is **not** proven

| Claim | Current evidence / boundary |
|---|---|
| SOS persisted and scheduled in BullMQ | Implemented; background jobs and restart recovery need fault testing |
| Competing sessions cannot select the same available ambulance in the main assignment path | Dedicated concurrency test exists; other write paths (swaps, manual transitions) need adversarial tests |
| Hospital webhook notifications | **Not implemented**; not advertised |
| Dynamic hospital capacity | Only database values; no verified real-world live bed feed |
| Optional Groq triage and first-aid suggestions | Model output may be inaccurate; not clinically reviewed |
| Maps ETA | Google Maps or approximate distance/speed fallback; never a guaranteed ETA |
| Redis/Mongo recovery | Reconciliation is proposed in PR #32; verify merge and fault-injection tests |
| Sub-300 ms assignment / million-user scale / clinical outcomes | **Not measured or validated; do not claim** |
| Horizontal Socket.IO fan-out | Redis adapter is configured; multi-instance driver presence and consistent scheduling require additional tests |

## Learning route (recommended order)

1. **Authentication**: `models/User.js`, `middleware/auth.js`, `controllers/authController.js`; explain JWT role and refresh-token rotation.
2. **Persistence**: `models/EmergencySession.js`, `models/Ambulance.js`; explain indexes and session state machine.
3. **SOS and durability**: `controllers/emergencyController.js`, `services/dispatchQueue.js`, `workers/dispatch.worker.js`; explain why acknowledgment differs from assignment.
4. **Dispatch algorithm**: `services/ambulanceCache.js`, `services/assignmentService.js`; dry-run GEOSEARCH, scoring, Lua claim and Mongo CAS.
5. **Consistency**: inspect PR #32 `assignmentReconciliation.js`; diagram a failure between Redis and Mongo, discuss compensation and eventual consistency.
6. **Real-time**: `sockets/emergencyRoom.js`, `frontend/src/hooks/useSocket.js`, patient/driver pages; trace room authorization and GPS updates.
7. **Delay/fallback**: `workers/delayDetection.worker.js` and `services/fallbackService.js`; demonstrate reroute and replacement with two test drivers.
8. **Operations**: `metrics.js`, `requestLogger.js`, `infra/observability/` and CI; measure latency and identify when alerts would fire.

**Honest project description for interviews:** “RapidAid is a real-time ambulance-dispatch coordination prototype built with Node.js, MongoDB, Redis, BullMQ and Socket.IO. I implemented durable SOS queueing, indexed nearby search, conditional reservations, driver tracking and monitoring, and I can explain the limitations of cross-store consistency and live-service reliability.” Do not represent it as a clinically deployed platform.
