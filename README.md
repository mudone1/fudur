# Fudur — Next.js 15 rebuild

Rebuild of `fudur-app.html` (the single-file HTML/Firebase prototype) as a
proper Next.js 15 + TypeScript + Tailwind + Firebase app.

## Progress so far

- **Phase 1 — Foundation + Auth + Driver flow** ✅
  - Next.js 15 App Router, TypeScript, Tailwind theme carrying over the
    original brand tokens (orange `#F05A00`, green `#4A7C2F`).
  - Firebase **Google Sign-In** (`signInWithPopup` + `GoogleAuthProvider`),
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

- **Phase 2.5 — product feedback round** ✅
  - **Instant driver activation**: applications no longer sit behind a fake
    "24-hour review" — `status` is set to `"approved"` immediately and the
    route is `active: true` right away (it already was; only the copy on
    the wizard's confirmation screen was lying about it, now fixed).
  - **Real landing page** at `/` — hero, feature highlights, "how it works"
    steps, and a driver CTA, instead of a bare logo + button. It no longer
    auto-redirects signed-in users away; they see a "Go to my dashboard"
    button instead, so the marketing page stays reachable any time.
  - **Way back to `/` from inside the app** — a small `fudur` wordmark link
    now sits above the header on `/driver/dashboard` and `/rider/home`.
  - **PWA installability**: `public/manifest.json` + a generated icon set
    (`public/icons/`) + a combined service worker served at
    `/firebase-messaging-sw.js`. Installable on both desktop and mobile.
  - **Push notifications** via Firebase Cloud Messaging: `enablePushNotifications()`
    (`src/lib/firebase/messaging.ts`) registers the SW, requests permission,
    and saves the FCM token via `/api/notifications/token`. `sendPushToUser()`
    (`src/lib/firebase/push.ts`) is wired into two events so far — a driver
    gets pushed when someone books their route, and chat participants get
    pushed on new messages. Both profile pages have an "Enable
    notifications" control.

- **Phase 2.6 — bugfixes from real-device testing** ✅
  - **Firestore security rules added** (`firestore.rules`, project root) —
    this was the actual reason chat wasn't working. A fresh Firestore
    project in production mode denies all reads/writes by default, and
    this rules file was never written or pasted into the console. **You
    need to paste this into Firebase console → Firestore Database → Rules
    → and click Publish** — it doesn't apply itself just by existing in
    the repo.
  - Removed leftover "Phone verified!" copy on complete-profile (holdover
    from the old phone-OTP flow).
  - `/find` now loads and shows **all available rides immediately**; the
    route/time filters narrow down instead of being required to see
    anything.
  - **Real phone calls, not in-app**: Call buttons are now plain `tel:`
    links using the driver's phone number, opening the phone's native
    dialer — no WebRTC/Twilio cost.
  - **Custom install prompt**: a bottom banner captures
    `beforeinstallprompt` directly and offers an "Install" button, since
    Chrome doesn't reliably show its own automatic banner. On iOS (which
    never fires that event), it shows a "tap Share → Add to Home Screen"
    hint instead.

- **Phase 2.7 — auth hardening + driver chat (previously missing entirely)** ✅
  - **Google Sign-In hardened**: the post-redirect flow is now handled
    centrally in `AuthContext` — it explicitly resolves `getRedirectResult`,
    fetches the profile, and routes to the correct destination itself,
    instead of relying on whichever page the browser happens to land back
    on after the OAuth round trip (not always predictable across browsers).
    Errors — including `auth/unauthorized-domain`, the most likely
    real-world cause of "sign-in silently does nothing" — now surface as a
    readable message on `/login` instead of failing silently. **If you
    deploy to a new domain, add it under Firebase console → Authentication
    → Settings → Authorized domains, or sign-in will fail.**
  - **Driver-side chat was simply missing** — drivers had no page to see or
    reply to any chat at all. Added `/driver/route/[routeId]/chat`,
    reachable via a "Chat" button on each route card in the driver
    dashboard: a group tab with everyone booked on that route today, plus a
    tab per individual rider for a direct thread. Shares the exact same
    Firestore threads riders already write to
    (`routeChats/{routeId}_{date}`, `directChats/{driverUid}_{riderUid}`),
    so messages sent from either side show up on both.
  - `/api/notifications/chat-sent` now handles both call shapes (rider
    sends with a `bookingId`, driver sends with a `routeId`).

- **Phase 3 — safety centre, saved routes, favourites, leaderboard** ✅
  - **A note on how this landed**: this backend was mostly built earlier
    but the summary of that work fell out of context along the way, and a
    duplicate/inferior safety implementation got built on top of it before
    the mismatch was caught. That duplicate (a single `emergencyContact`
    field on the profile, a separate `/safety` rebuild, a redundant
    `/api/public/trip` route) has been removed. What's below is the
    reconciled, single, correct version — worth knowing in case you spot
    references to "emergency contact" vs "trusted contacts" in older
    context; **trusted contacts** (plural, in their own subcollection) is
    the real one.
  - **`/safety`** — one Safety Centre reachable from both rider and driver
    profile menus and both dashboards. Has: an SOS button (logs an alert to
    `sosAlerts` and immediately opens a `tel:` link to your first trusted
    contact — there's no live ops team monitoring that collection yet, so
    the copy doesn't claim there is), multiple trusted contacts you can
    add/remove, a "share your trip" button (builds a `/share/{bookingId}`
    link off your current active booking — works for direct or group chat,
    no login needed to view), general safety tips, and an incident report
    form (`reports` collection, `status: "open"`, no admin UI to triage it
    yet — that's the next thing worth building before this handles real
    volume).
  - **`/rider/saved-routes`** — save a from/to pair, see live driver count +
    lowest current price for it, jump straight to `/find`.
  - **`/rider/favourites`** — favourite a driver from their detail page
    (heart toggle next to the Verified badge on `/ride/[routeId]`); the
    favourites list shows their current active route if they have one and
    links straight to booking it.
  - **`/leaderboard`** — top 10 by trip count (ties by rating), separate
    tabs for drivers and riders, shows your own rank below the top 10 if
    you're not in it.

Not yet built: real content for `/driver/notifications` (currently a
static stub), and an admin/ops view for reviewing `sosAlerts` and
`reports` — both collections are being written correctly, there's just
nowhere in-app to read them yet.

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
signed in with Google before starting the wizard (redirects to `/login`
otherwise). Phone number is kept as a plain contact field the driver fills
in themselves (not verified via SMS, since that's the Blaze-only feature
we moved away from).

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

1. **Authentication** → Sign-in method → enable **Google**. (Switched from
   Phone OTP because Phone auth requires the Blaze billing plan; Google
   Sign-In works on the free Spark plan.) You'll need to add your local dev
   origin (`http://localhost:3000`) and your Vercel domain to the OAuth
   "Authorized domains" list under Authentication → Settings.
2. **Firestore** → create in production mode. Collections used so far:
   - `users/{uid}` — `{ uid, phone, name, area, type, rating, trips, createdAt }`
   - `driverApplications/{uid}` — full application payload + `status`
   - `routes/{autoId}` — `{ driverUid, from, to, departureTime, meetingPoint, days, pricePerSeat, seats, seatsBooked, active, car: {...} }`
   - `bookings/{autoId}` — `{ routeId, riderUid, driverUid, status, tripDate, fare, createdAt }`
   - `trips/{autoId}` — `{ driverUid, riderUid, bookingId, route, fare, passengers, riderRating, tags, comment, completedAt }` — written when a rider submits a post-ride rating; powers both driver earnings and rider ride history
   - `users/{uid}/trustedContacts/{autoId}` — `{ name, phone }`, per-user subcollection for the Safety Centre
   - `sosAlerts/{autoId}` — `{ riderUid, riderName, riderPhone, bookingId, routeId, driverUid, createdAt }` — logged on SOS press; no in-app review UI yet, check Firestore console directly if you need to
   - `reports/{autoId}` — `{ reporterUid, reason, description, bookingId, status: "open", createdAt }` — same caveat, no triage UI yet
   - `savedRoutes/{autoId}` — `{ riderUid, from, to, createdAt }`
   - `favouriteDrivers/{autoId}` — `{ riderUid, driverUid, createdAt }`
   - `routeChats/{routeId}_{tripDate}/messages/{autoId}` — group chat, written directly from the client
   - `directChats/{driverUid}_{riderUid}/messages/{autoId}` — driver↔rider chat, written directly from the client
3. **Security rules — do this, it's not automatic**: open `firestore.rules`
   in this repo, copy its contents, paste into Firebase console →
   **Firestore Database → Rules**, and click **Publish**. Chat (the only
   thing written directly from the client instead of via API routes) will
   silently fail without this — messages just won't send or appear, no
   error dialog.
4. **Composite indexes** — Firestore will show a "create index" link in the
   server logs the first time each of these runs; click it:
   - `trips`: `driverUid ==` + `completedAt desc` (driver earnings)
   - `trips`: `riderUid ==` + `completedAt desc` (rider ride history)
5. Generate an **Admin SDK** service account key (Project settings → Service
   accounts) for the `FIREBASE_ADMIN_*` env vars. Keep this out of git.
6. **Push notifications**: Project settings → **Cloud Messaging** tab →
   under "Web configuration" → "Web Push certificates" → **Generate key
   pair**. Paste it into `NEXT_PUBLIC_FIREBASE_VAPID_KEY`. Without this, the
   "Enable notifications" button will just silently no-op (checked and
   logged to console, not a hard error).
   - On `localhost`, push notifications work over plain HTTP for
     development. On Vercel, they need HTTPS, which Vercel gives you by
     default — no extra config needed there.
   - iOS Safari only supports push notifications for PWAs added to the
     Home Screen (not in a regular Safari tab) — this is an Apple
     platform limitation, not something fixable in code.

## Project structure

```
src/
  app/
    page.tsx                          landing / router
    login/page.tsx                     Google Sign-In
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

