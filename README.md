# Fudur — Next.js 15 rebuild

Rebuild of `fudur-app.html` (the single-file HTML/Firebase prototype) as a
proper Next.js 15 + TypeScript + Tailwind + Firebase app.

## Progress so far

- **Phase 1 — Foundation + Auth + Driver flow** ✅
  - Next.js 15 App Router, TypeScript, Tailwind theme carrying over the
    original brand tokens (orange `#F05A00`, green `#4A7C2F`).
  - Firebase Phone OTP auth (`RecaptchaVerifier` + `signInWithPhoneNumber`),
    `AuthContext`, complete-profile step for new numbers.
  - `/driver/register` (4-step wizard), `/driver/dashboard`,
    `/driver/earnings`, plus `/driver/notifications` and `/driver/profile`
    stubs so the bottom nav doesn't 404.
- **Phase 2 — Rider flow** ✅
  - `/find` — search by route + time-of-day filters
  - `/ride/[routeId]` — driver detail, car info, today's passengers
  - `/ride/[routeId]/book` — booking confirm → creates a `bookings` doc
    inside a Firestore transaction (atomic seat check)
  - `/trip/[bookingId]/chat` — realtime group + driver chat via Firestore
    `onSnapshot`, same pattern as the original prototype
  - `/trip/[bookingId]/live` — ride-in-progress screen
  - `/trip/[bookingId]/rate` — post-ride rating (driver + co-riders), writes
    a `trips` doc and updates running-average ratings
  - `/rider/home` — "My rides": upcoming ride, group chat/call shortcuts,
    ride history

Not built yet (Phase 3): safety/SOS, leaderboard, saved routes, favourite
drivers, real notification content.

## Architecture decisions carried over from Superior Minds Academy

- **Next.js API routes + Firebase Admin SDK**, not Cloud Functions (same
  constraint: Blaze-plan Cloud Functions weren't an option). Every write that
  needs to be trusted (profile creation, driver applications, bookings,
  ratings) goes through `src/app/api/**/route.ts`, which verifies the
  caller's ID token via `verifyRequestToken()` before touching Firestore.
- Client components only ever call `fetch("/api/...")` with
  `Authorization: Bearer <idToken>` — they never import `firebase-admin`.
- **Exception: chat.** Chat is realtime by nature, so it bypasses the API
  layer and uses the client Firestore SDK directly with `onSnapshot`/`addDoc`
  — the same approach the original prototype used. This needs Firestore
  security rules restricting `routeChats/*` and `directChats/*` writes to
  participants of that ride (see below).

## One deliberate change from the original prototype

The original `page-register-driver` step 1 collected email **and password**,
as if driver signup were a separate auth mechanism. Since the app's only real
auth mechanism (here and in the prototype) is phone OTP, the rebuilt wizard
drops the password field and requires the visitor to already be
phone-verified before starting the wizard (redirects to `/login` otherwise).
Email is kept as an optional contact field.

## Simplifications worth knowing about

- **"Today" as the unit of booking.** Routes are recurring commutes, but each
  `bookings` doc is scoped to one calendar day (`tripDate: "YYYY-MM-DD"`).
  There's no future-dating or recurring-booking UI yet.
- **Ratings are simple running averages**, computed in
  `/api/bookings/[bookingId]/rate` — no weighting, no fraud detection.
- **No payments.** Same as the original: cash/transfer directly to the
  driver, as the in-app notice says.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in Firebase config + admin credentials
npm run dev
```

### Firebase project setup (fudur-18485)

1. **Authentication** → Sign-in method → enable **Phone**.
2. **Firestore** → create in production mode. Collections used so far:
   - `users/{uid}` — `{ uid, phone, name, area, type, rating, trips, createdAt }`
   - `driverApplications/{uid}` — full application payload + `status`
   - `routes/{autoId}` — `{ driverUid, from, to, departureTime, meetingPoint, days, pricePerSeat, seats, seatsBooked, active, car: {...} }`
   - `bookings/{autoId}` — `{ routeId, riderUid, driverUid, status, tripDate, fare, createdAt }`
   - `trips/{autoId}` — `{ driverUid, riderUid, bookingId, route, fare, passengers, riderRating, tags, comment, completedAt }` — written when a rider submits a post-ride rating; powers both driver earnings and rider ride history
   - `routeChats/{routeId}_{tripDate}/messages/{autoId}` — group chat, written directly from the client
   - `directChats/{driverUid}_{riderUid}/messages/{autoId}` — driver↔rider chat, written directly from the client
3. **Composite indexes** — Firestore will show a "create index" link in the
   server logs the first time each of these runs; click it:
   - `trips`: `driverUid ==` + `completedAt desc` (driver earnings)
   - `trips`: `riderUid ==` + `completedAt desc` (rider ride history)
4. **Firestore security rules** — at minimum, restrict writes to
   `routeChats/**` and `directChats/**` to authenticated users who are the
   driver or a currently-booked rider on that route/day (the API routes
   already enforce this for everything else via the Admin SDK).
5. Generate an **Admin SDK** service account key (Project settings → Service
   accounts) for the `FIREBASE_ADMIN_*` env vars. Keep this out of git.

## Project structure

```
src/
  app/
    page.tsx                          landing / router
    login/page.tsx                     phone + OTP
    complete-profile/page.tsx          name + account type + area
    find/page.tsx                      search rides
    ride/[routeId]/page.tsx            driver detail
    ride/[routeId]/book/page.tsx       booking confirm
    trip/[bookingId]/chat/page.tsx     group + driver chat (Firestore onSnapshot)
    trip/[bookingId]/live/page.tsx     ride in progress
    trip/[bookingId]/rate/page.tsx     post-ride rating
    rider/home/page.tsx                My Rides (rider home)
    driver/
      register/page.tsx                4-step wizard wrapper
      dashboard/page.tsx
      earnings/page.tsx
      notifications/page.tsx           stub
      profile/page.tsx
    api/
      profile/route.ts                 GET/POST — read or create user profile
      driver/apply/route.ts            GET/POST — driver application + first route
      driver/earnings/route.ts         GET — aggregated earnings + trip log
      driver/routes/route.ts           GET — caller's posted routes
      rides/search/route.ts            GET — search active routes by from/to
      rides/[routeId]/route.ts         GET — route + driver + today's passengers
      bookings/route.ts                POST — create booking (transactional seat check)
      bookings/current/route.ts        GET — caller's active booking today
      bookings/[bookingId]/route.ts    GET — booking + route + driver + co-riders
      bookings/[bookingId]/rate/route.ts  POST — submit ratings, write trip, update averages
      trips/history/route.ts           GET — rider's completed trip history
  components/
    ui/            Button, Field (shared primitives)
    layout/         TopNav, DriverBottomNav
    auth/            RequireAuth (route guard)
    driver/         RegisterWizard
  contexts/AuthContext.tsx             phone OTP + profile state
  lib/
    firebase/{client,admin}.ts
    authFetch.ts                       fetch() + Bearer <idToken> helper
    hooks/useDriverEarnings.ts
  types/index.ts
```

