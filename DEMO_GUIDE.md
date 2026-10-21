# RapidAid — Two-Device Demo Guide

This guide describes an isolated two-device engineering demo, not real emergency assistance. It requires two test accounts and valid local or HTTPS geolocation.

## 1. Backend configuration

Copy `backend/.env.example` to `backend/.env` and configure MongoDB, Redis, JWT secrets, and the frontend origin. Google Maps and Groq are optional.

For a fast live demo set:

```env
DEMO_MODE=true
```

In demo mode the delay worker checks every 15 seconds and treats roughly 30 seconds without meaningful movement as a stall. In normal mode the worker checks every 60 seconds and uses a 120-second stall threshold unless `STALL_THRESHOLD_SECONDS` is configured. Neither mode is clinically validated.

## 2. Seed demo accounts

**Only with a dedicated, disposable local/demo MongoDB database:** set `ALLOW_DEMO_SEED=true` in `backend/.env` and then from `backend/` run:

```bash
npm run seed
```

Useful accounts:

- Admin: `admin@rapidaid.com` / `admin123`
- Driver 1: `driver1@rapidaid.com` / `driver123`
- Driver 2: `driver2@rapidaid.com` / `driver123`

Create a normal patient account from the UI.

## 3. Start the apps

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

For two physical phones, expose the frontend/backend over HTTPS (for example through your normal deployment or a secure tunnel) because mobile geolocation requires a secure origin outside localhost.

## 4. Driver setup

1. Log in on Device B with `driver1@rapidaid.com`.
2. Open the Driver Command Center.
3. Tap **Go Online** if the ambulance is offline.
4. Allow precise location access.
5. Keep the browser/app open.

Only ambulances whose drivers are currently connected/online are eligible for assignment.

For swap demonstrations, repeat these steps on Device C with `driver2@rapidaid.com` and keep Driver 2 online at a location that produces a meaningfully better ETA.

## 5. Patient emergency flow

1. Log in as a normal user on Device A.
2. Allow location access.
3. Trigger an emergency.
4. RapidAid persists and queues the session, returning `INITIATED` (not a confirmed assignment); AI assistance is computed asynchronously.
5. The chosen driver's dashboard receives `driver_assignment` in real time.
6. The patient tracking page receives `ambulance_assigned`.

## 6. Start live trip

On the chosen driver device:

1. Tap **Accept & Start Trip**.
2. The session becomes `EN_ROUTE`.
3. The driver phone continuously emits GPS coordinates.
4. Redis stores the live ambulance position.
5. The patient receives `driver_location` events and sees the ambulance marker move.
6. ETA is recalculated approximately every 30 seconds using Google Maps traffic data, with Haversine fallback when Maps is unavailable.

## 7. Demonstrate delay / fallback

With `DEMO_MODE=true`:

1. Start the trip.
2. Stop moving for about 30 seconds.
3. BullMQ detects the stall.
4. Session becomes `DELAYED`.
5. Patient and driver receive a delay alert.
6. Level 1 sends a reroute suggestion and a fresh navigation link.
7. If rerouting does not materially improve ETA, Level 2 searches online available ambulances.
8. If another ambulance improves ETA by more than two minutes, RapidAid swaps the assignment and notifies both drivers and the patient.
9. If no suitable ambulance is available, RapidAid may send an informational AI delay message and continue retrying replacement. **No hospital webhook is implemented.**

## Important demo conditions

- A driver must be logged in and online before the patient triggers the emergency.
- Browser/mobile location permission must be enabled.
- The patient and driver should be geographically close enough to fall inside the assignment search area.
- A replacement driver must also be online for the swap fallback to succeed.
- Google Maps produces better traffic-aware ETAs when `GOOGLE_MAPS_API_KEY` is configured; otherwise RapidAid uses distance-based estimates.

## Production note

`DEMO_MODE` exists only to make delay/fallback behavior observable in a short presentation. Use normal thresholds in production-like environments.
