# StoreKeeper web

Next.js (App Router) front end for the StoreKeeper API.

```
cp .env.example .env.local   # point API_URL at the API
npm install
npm run dev                  # http://localhost:3001
npm run typecheck
```

The browser never calls the API directly, so no CORS setup is needed for the web app.

Stack: Next.js 16.3, React 19.3, TypeScript 7, `radix-ui`, TanStack Query 5, lucide-react.
With TypeScript 7, `next build` type-checks through the project-local `tsc` (the default in Next 16.3).
Themes: Galvanized and Night crib, switched with a `data-theme` attribute on `<html>`.

This first slice covers sign-in, the app shell and the Outstanding view.

## Routes

Public: `/`, `/about`, `/contact`, `/blog`, `/blog/[slug]`, `/legal`, `/legal/[slug]` (terms, privacy, cookies, acceptable-use, data-processing, security).
Auth: `/login`, `/register`, `/forgot-password`, `/reset-password?token=`, `/accept-invite?token=`.
App: `/dashboard`, `/outstanding`, `/low-stock`, `/catalog`, `/items/[id]`, `/transactions`, `/holders`,
`/reconciliation`, `/approvals`, `/activity`, `/notifications`, `/insights`, `/imports`, `/team`, `/settings`.

All API calls go through `src/lib/endpoints.ts` (`sk.*`), which mirrors every `/v1` route.
See `IMAGES.md` for the image slots on the public pages. Legal text is template copy and needs lawyer review.

## Offline

Check out, check in, consume and restock are saved on the device when there is no connection (or the request fails
at the network level) and replayed through `POST /sync/batch` when it returns. The sync bar shows the queue.
Each action's client id is also its idempotency key online and offline, so a lost response can never record a movement twice.
Conflicts and failures become records for a supervisor under Activity. Adjustments, loss and damage, and counts are online-only by design.
The queue is in `localStorage`; item and holder search still needs the network, so the next step is persisting the query cache.

## Contact form

`/contact` posts to `POST /v1/public/contact`. It is unauthenticated, rate-limited per IP, has a honeypot field, and stores the message in `contact_messages`. The worker emails it to `CONTACT_INBOX` (set it, and `MAIL_ENABLED=true`, on the API/worker). Blog posts live in `src/lib/blog.ts`.

## Scanning and quick return

The Scan button (top bar on desktop, floating button on phones) opens the camera and reads QR, Code 128/39, EAN/UPC and Data Matrix
through the browser's `BarcodeDetector`, then resolves the code with `GET /items/lookup` (QR value, asset tag or SKU).
The result sheet offers the one action that makes sense: check out, return, issue, consume or restock. Offline it saves to the queue.
The camera needs HTTPS (localhost is fine). Where `BarcodeDetector` is missing (some iOS and Firefox versions) the dialog falls
back to typing a code; Bluetooth and USB keyboard-style scanners work anywhere in the app without opening the dialog.
Outstanding has a one-tap Return per row, with damaged and needs-inspection variants, and a partial return for consumables.

## Installable app and offline data

- `app/manifest.ts` and `public/icons/*` make the site installable (Add to Home Screen, or the Install button in the top bar).
- `public/sw.js` caches the app shell and visited pages (production builds only). It never touches API calls.
- `src/lib/cache.ts` keeps a copy of items, people, teams and jobs in IndexedDB, refreshed every few minutes while online
  and wiped on sign-out. Scanning, the item picker and the holder picker fall back to it when the network is down.
  Settings > Account shows what is saved and lets you refresh it.
- TanStack Query is set to `offlineFirst` for queries and `always` for mutations. Without this, a mutation made offline would
  wait for the network instead of reaching the offline queue.
- Test offline in a production build (`npm run build && npm start`) with DevTools > Network > Offline. The service worker is off in `npm run dev`.

## Photos

`PhotoField` takes or picks a photo, shrinks it to 1600px JPEG in the browser, uploads it to `POST /files`, and returns the file id.
Items accept a photo on create and from the item page (admins and supervisors). Check out, check in, adjustments and loss or damage
take an optional evidence photo (`snapshotFileId`). Photos need a connection; the offline queue carries no photos because the
sync endpoint does not accept them.

## Roles and sessions

`src/lib/roles.ts` mirrors the API's role checks so people only see what they can do (viewers get a read-only app; store staff
cannot see Insights, Import or Team; approvals, catalog edits and holder edits follow the API). The API stays the authority.
When any call returns 401 the session is cleared, the user lands on sign-in with an explanation, and the offline queue is kept
and replays after signing in again.

## Tests, CI and Docker

- `npm run typecheck` checks everything, including the e2e code.
- `npm run e2e` runs the Playwright tests against a live API (`E2E_API_URL`, default `http://localhost:3000`) and web server
  (`E2E_BASE_URL`, default `http://localhost:3001`). Install the browser once with `npx playwright install chromium`.
  Each test registers its own organization through the API, so tests are independent. They cover registration, sign-in,
  wrong password, expired session, issue and one-tap return, double-issue refusal, and an offline checkout that syncs on reconnect.
- `.github/workflows/ci.yml` runs API typecheck, build and tests (real Postgres and Redis), web typecheck and build, then the e2e suite.
  `docker.yml` builds both images on every relevant pull request and publishes them to GHCR from `main` and version tags.
- Build the web image with `docker build --build-arg NEXT_PUBLIC_SITE_URL=https://example.com -t storekeeper-web ./web` and run it with `-e API_URL=https://api.example.com`.
  `API_URL` is read at run time, so one image works in every environment.
- Commit `package-lock.json` in both `/` and `/web` after your first install, then CI uses `npm ci` for repeatable builds.

## Sessions (httpOnly cookies, server-side API calls)

The browser only talks to this origin. `src/app/api/v1/[...path]/route.ts` is a thin proxy that calls the StoreKeeper API from the server:

- Login, register, accept-invite and password change return an API token. The proxy moves it into an **httpOnly** `sk_session` cookie
  (Secure in production, SameSite=Lax, lifetime taken from the token's expiry) and removes it from the response, so page scripts never see it.
- A readable `sk_auth=1` cookie carries no secret; it only tells the app whether to ask "who am I" at all.
- Every proxied call gets `Authorization: Bearer <cookie>` added on the server. A 401 or a logout clears both cookies.
- Writes from another origin are refused (`Origin` / `Sec-Fetch-Site` check), on top of SameSite.
- If the API cannot be reached the proxy answers 502 `UPSTREAM_UNAVAILABLE`, which the app treats like being offline (movements queue on the device).
- Run it behind a proxy or load balancer that sets `X-Forwarded-For` and strips client-supplied values: it is forwarded to the API for per-IP rate limits.
- Settings: `API_URL` (run time, server only) and optional `COOKIE_SECURE`.
