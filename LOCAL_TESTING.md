# Local testing and demo

Use Node 22 or 24, npm and Docker Desktop. Validation used Node 24.11.0 on Windows. Commands below are PowerShell, starting at the repository root. Existing backend/.env is never overwritten.

## Automated checks

```powershell
docker compose -f compose.test.yml up -d --wait
npm ci
npm --prefix backend ci
npm --prefix backend test
npm --prefix frontend ci
npm --prefix frontend run build
npm --prefix backend audit --omit=dev
npm --prefix frontend audit
```

Tests use real MongoDB 7 and Redis 7. Jest sets NODE_ENV=test before imports and skips backend/.env. Global setup checks connectivity before suites run. Each suite drops its disposable Mongo database, explicitly creates indexes before concurrency tests, and flushes Redis database 15. Teardown runs after suite cleanup and closes BullMQ workers/events/queues, ioredis and MongoDB. No forceExit is used.

| Variable | Default | Allowed override |
| --- | --- | --- |
| TEST_MONGO_URI | mongodb://127.0.0.1:27018/rapidaid_test_jest | Loopback port 27018, database rapidaid_test_[letters/digits/underscores] |
| TEST_REDIS_URL | redis://127.0.0.1:6380/15 | Loopback port 6380, database 15 |
| NODE_ENV | Forced to test | No runtime .env loading |
| JWT_SECRET / JWT_REFRESH_SECRET | Different fixed local test values | Replaced during tests |
| GROQ_API_KEY / GOOGLE_MAPS_API_KEY | Empty | External APIs disabled |

Cloud/SRV URLs, credentials, query options, ordinary local database ports, Redis database 0 and non-test Mongo database names are rejected before connection. Do not put shared services on these test ports. Do not run concurrent test invocations against the same services: tests reset these fixtures. No .env.test or secrets are needed.

```powershell
# Stop and discard only test infrastructure when finished.
docker compose -f compose.test.yml down -v
```

Mongo test storage is tmpfs and Redis persistence is disabled. Demo data uses a different Compose project and ports.

## Start the local demo

```powershell
docker compose -f compose.local.yml up -d
npm --prefix backend ci
npm --prefix frontend ci
cd backend
$env:NODE_ENV='development'
$env:MONGO_URI='mongodb://127.0.0.1:27019/rapidaid_demo'
$env:REDIS_URL='redis://127.0.0.1:6381/0'
$env:JWT_SECRET = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
$env:JWT_REFRESH_SECRET = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
$env:CLIENT_URL='http://localhost:5173'
$env:GOOGLE_MAPS_API_KEY=''
$env:GROQ_API_KEY=''
$env:DEMO_MODE='true'
$env:ALLOW_DEMO_SEED='true'
npm run seed
$env:ALLOW_DEMO_SEED='false'
npm run dev
```

Seed deletes demo drivers/admins/ambulances/hospitals. Use only the disposable demo database above. Keep this terminal/environment for the server. Alternatively put these settings in untracked backend/.env using .env.example; preserve your existing secrets.

In a second terminal from the repository root:

```powershell
$env:VITE_API_URL='http://localhost:5000'
$env:VITE_SOCKET_URL='http://localhost:5000'
npm --prefix frontend run dev
```

1. Check http://localhost:5000/api/v1/health reports MongoDB and Redis connected.
2. Open separate browser profiles at http://localhost:5173. Register a patient in one; log in as driver1@rapidaid.com / driver123 in the other.
3. Allow location access; use simulated locations near 25.3176, 82.9739 if needed. Keep the driver open and Go Online.
4. Trigger SOS: expect INITIATED then ASSIGNED, one driver notification and a BUSY ambulance. Check patient tracking.
5. Driver starts the trip: verify EN_ROUTE, GPS/ETA updates and chat. Refresh both pages and confirm assignment recovery.
6. In DEMO_MODE stop moving for roughly 30 seconds plus a polling interval: verify DELAYED and reroute feedback. Swapping requires another online nearby driver with ETA better by more than two minutes.
7. Follow arrival/OTP UI through completion. Verify RESOLVED and ambulance availability. Log out and verify the previous refresh token is rejected.
8. Trigger two patients with one online ambulance: only one gets assigned; the other stays pending. The assigned ambulance must remain BUSY and absent from the available set.

Physical phones require HTTPS for geolocation, reachable server addresses and matching CLIENT_URL. This browser/GPS/OTP/swap checklist has not been executed here. Automated checks cover API lifecycle, auth/refresh revocation, assignment concurrency, reconciliation, availability refusal, AI fallback, and real delay/maps queue consumption.

## Audit and verification

See [TEST_READINESS_REPORT.md](TEST_READINESS_REPORT.md) for executed checks, vulnerable dependency groups, integration review and limits. Full backend audit still reports development-only advisories; runtime audit and frontend audit are checked separately.
