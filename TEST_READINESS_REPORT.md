# Test readiness verification (2026-10-21)

## Root causes and changes

- Jest tests and app.js loaded backend/.env; Jest's NODE_ENV=test alone never substituted Mongo/Redis URLs. App imports therefore reached the configured external Redis host, and test fixture cleanup could target the configured Mongo database. Tests now set explicit safe URLs before imports and skip dotenv.
- BullMQ parsed host/password/TLS but discarded the Redis URL database path. Even setting /15 for ioredis left queues in database 0. BullMQ now uses the parsed database number, with connection validation shared with ioredis.
- Importing emergency routes created dispatch/delay queues, QueueEvents and the delay consumer. Delay/maps consumers now start explicitly in server startup; queue connections are lazy. Existing API queue scheduling still uses real BullMQ.
- Tests closed Mongo but omitted BullMQ/ioredis cleanup. Duplicate utils/redis.js created a second Redis client. It now shares the configured singleton; a Jest environment teardown closes tracked resources after all suite cleanup hooks. --forceExit was removed.
- Model indexes previously depended on asynchronous auto-index initialization. Isolated fixture setup explicitly creates indexes before concurrency assertions.
- Added worker regression exposed a distinct Maps QueueEvents race: a fast local worker completed before its listener was ready (test timed out at 30 seconds). Waiting for QueueEvents readiness before enqueue fixed it; the real worker test now passes.

## Executed failure investigation

The supplied historical count (2 failed suites / 13 failed tests) was not re-executed against the old cloud URLs: doing so could mutate shared Mongo data through existing cleanup hooks. Every existing test was inspected and executed against dedicated local services.

- First isolated run began before Docker image download finished: 5 suites / 45 tests failed from Mongo ECONNREFUSED 127.0.0.1:27018 and Redis connection closure, rather than useful domain assertion failures.
- Once services were ready, all original 45 assertions passed. Three suites still failed cleanup with MongoNotConnectedError (shared afterAll ran before suite afterAll). Moving connection shutdown to environment teardown fixed ordering.
- The new Maps worker test then failed with a 30000 ms timeout despite its worker computing an ETA. Listener startup was fixed and retested.
- No auth, refresh-token, emergency lifecycle, assignment, reconciliation or AI fallback assertion needed to be removed or weakened. The assignment test additionally checks BUSY after rejected availability updates.

## Actual successful results

Full Jest run: **6 suites, 56 tests passed**, 0 failed. Ran with --runInBand --detectOpenHandles, no forceExit.

- testInfrastructure.test.js: 11 assertions passed.
- emergencyFlow.test.js: 10 assertions passed.
- auth.test.js: 9 assertions passed.
- assignmentConcurrency.test.js: 3 assertions passed.
- emergencySession.test.js: 11 assertions passed.
- aiServices.test.js: 12 assertions passed.

Also executed: frontend production build (Vite 8.3.5), Docker Compose test up --wait (both services healthy), npm audits of all three manifests, and a clean backend npm ci followed by npm test against Compose services. Final logs contain no Upstash/ENOTFOUND, uncontrolled Redis errors or Jest leaked-handle report. Build has a non-fatal >500 kB chunk warning; Mongoose emits deprecation warnings for existing new:true options.

## PR integration review

Actual Git remote was SHUBHANSHU602/RAP_AID (redirects to RapidAid). Fetch retrieved integration/readiness-32-35 at 06d5dcb8f5dfd398666254da775e32ea1f0b3941; the fix branch was created from it with a clean initial working tree. GitHub metadata reports PR #36 was already merged before this session. No PR was merged or modified here.

Compared PR #32/#33/#34/#35 patches and current integration code:

- #32: reconciliation service, periodic/startup invocation, both BUSY restoration and stale available-set membership tests are present.
- #33: benchmark uses per-run users/session IDs, current latency return shape and ownership-scoped cleanup. Integration also includes the follow-up Redis status/reservation/ETA cleanup commit 06d5dcb. Benchmark was reviewed, not run; failure-safe finally cleanup remains a limitation.
- #34: truthful README/demo docs, optional API configuration, removed hospital webhook settings and misleading frontend latency promise, and CI syntax checks are present. Local setup instructions are updated in this fix.
- #35: Mongo conditional assignedSessionId:null guard precedes publishing AVAILABLE. Its refusal assertion coexists with both reconciliation tests, and now explicitly rechecks Redis BUSY afterward.

Passing regressions verify the tested assignment/refusal/reconciliation paths. They do not prove every interleaving across two independent stores is impossible; adversarial concurrent availability/reconciliation/swap writes and process-crash fault injection remain unverified.

## Dependency audit

Initial backend audit: 17 affected packages (1 critical, 9 high, 7 moderate). Initial frontend audit: 4 high packages. Compatible npm audit fix updates were applied to root/backend/frontend lockfiles; no --force major changes were used. Removed unused legacy bull (all application queues use bullmq), which also removes its vulnerable uuid dependency. Moved Jest and Supertest to devDependencies.

Initial backend package findings:

| Package | Severity | Usage |
| --- | --- | --- |
| argparse | moderate | Development/test dependency chain |
| axios | high | Runtime dependency chain (bull unused) |
| baseline-browser-mapping | moderate | Development/test dependency chain |
| brace-expansion | high | Development/test dependency chain |
| braces | high | Development/test dependency chain |
| browserslist | high | Development/test dependency chain |
| bull | moderate | Runtime dependency chain (bull unused) |
| chokidar | high | Development/test dependency chain |
| engine.io | high | Runtime dependency chain (bull unused) |
| follow-redirects | high | Runtime dependency chain (bull unused) |
| ip-address | moderate | Runtime dependency chain (bull unused) |
| js-yaml | high | Development/test dependency chain |
| nodemon | high | Development/test dependency chain |
| proxy-addr | critical | Runtime dependency chain (bull unused) |
| qs | moderate | Runtime dependency chain (bull unused) |
| sprintf-js | moderate | Development/test dependency chain |
| uuid | moderate | Runtime dependency chain (bull unused) |

Frontend's four high packages were axios and follow-redirects (HTTP dependencies), source-map-js (build tooling) and vite (development/build tooling). All are resolved by compatible updates. The critical backend proxy-addr and runtime engine.io/axios/follow-redirects/qs/ip-address advisories are also resolved.

Final audits: **root 0; frontend 0; backend --omit=dev 0**. Full backend audit still reports **22 affected packages (3 high, 19 moderate), all development-only**:

- High: braces -> chokidar -> nodemon, stack exhaustion from deeply nested glob patterns. npm proposes nodemon 1.14.10, a breaking downgrade; not applied.
- Moderate: sprintf-js -> argparse -> js-yaml -> @istanbuljs/load-nyc-config -> babel-plugin-istanbul -> Jest tooling. npm proposes Jest 25.0.0, a breaking downgrade; not applied. Npm counts propagated parent packages separately.

Exact remaining affected package names:

@istanbuljs/load-nyc-config, @jest/core, @jest/expect, @jest/globals, @jest/reporters, @jest/transform, argparse, babel-jest, babel-plugin-istanbul, braces, chokidar, jest, jest-circus, jest-cli, jest-config, jest-resolve-dependencies, jest-runner, jest-runtime, jest-snapshot, js-yaml, nodemon, sprintf-js.

Do not use audit fix --force to turn this into an older incompatible Jest/nodemon installation. Reassess patched upstream releases or a separate tooling migration. These findings do not affect npm ci --omit=dev runtime installations.

## Remaining unverified scenarios

Real patient/driver browsers and physical phones, geolocation permissions, Socket.IO reconnect across multiple instances, OTP completion UI, delay rerouting/replacement with real GPS, live Google Maps/Groq success paths, crash/fault injection, benchmark performance/failure cleanup and hosted CI execution. Local demo Compose is provided; the patient/driver manual checklist is in LOCAL_TESTING.md. No production/shared database or existing .env was modified.

## Files changed

- `.github/workflows/demo-ready-ci.yml`
- `.gitignore`
- `DEMO_GUIDE.md`
- `LOCAL_TESTING.md`
- `Readme.md`
- `TEST_READINESS_REPORT.md`
- `backend/.env.example`
- `backend/app.js`
- `backend/package-lock.json`
- `backend/package.json`
- `backend/server.js`
- `backend/src/__tests__/aiServices.test.js`
- `backend/src/__tests__/assignmentConcurrency.test.js`
- `backend/src/__tests__/auth.test.js`
- `backend/src/__tests__/emergencyFlow.test.js`
- `backend/src/__tests__/emergencySession.test.js`
- `backend/src/__tests__/testInfrastructure.test.js`
- `backend/src/config/bullmq.js`
- `backend/src/config/redis.js`
- `backend/src/config/resources.js`
- `backend/src/config/testSafety.js`
- `backend/src/services/dispatchQueue.js`
- `backend/src/utils/redis.js`
- `backend/src/workers/delayDetection.worker.js`
- `backend/src/workers/dispatch.worker.js`
- `backend/src/workers/mapsQueue.worker.js`
- `backend/test/environment.cjs`
- `backend/test/environment.js`
- `backend/test/lifecycle.js`
- `backend/test/preflight.js`
- `compose.local.yml`
- `compose.test.yml`
- `frontend/package-lock.json`
- `package-lock.json`
