# StoreKeeper web architecture

This is the Next.js App Router frontend for the StoreKeeper API. Route components present the pages, shared components implement reusable interface and workflow pieces, and `src/lib` owns API access, session state, permissions, and offline behavior.

## Project tree

```text
.
â”œâ”€â”€ e2e/                         Playwright browser flows
â”‚   â”œâ”€â”€ auth.spec.ts             Registration and authentication scenarios
â”‚   â”œâ”€â”€ checkout.spec.ts         Issue/return and movement scenarios
â”‚   â”œâ”€â”€ offline.spec.ts           Offline queue and reconnect scenario
â”‚   â””â”€â”€ helpers.ts               Shared test setup and API helpers
â”œâ”€â”€ public/                      Static assets served as-is
â”‚   â”œâ”€â”€ icons/                   PWA and Apple touch icons
â”‚   â”œâ”€â”€ offline.html             Offline fallback page
â”‚   â””â”€â”€ sw.js                    Production service worker
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/                     Routes, layouts, and Next metadata endpoints
â”‚   â”‚   â”œâ”€â”€ (app)/                Signed-in workspace routes
â”‚   â”‚   â”‚   â”œâ”€â”€ activity/         Activity feed, audit, and sync conflicts
â”‚   â”‚   â”‚   â”œâ”€â”€ approvals/        Approval queue
â”‚   â”‚   â”‚   â”œâ”€â”€ catalog/          Catalog, shelves/[shelfId], categories/[categoryId]
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard/        Dashboard
â”‚   â”‚   â”‚   â”œâ”€â”€ holders/          People/holder records
â”‚   â”‚   â”‚   â”œâ”€â”€ imports/          Import workflow
â”‚   â”‚   â”‚   â”œâ”€â”€ insights/         Analytics
â”‚   â”‚   â”‚   â”œâ”€â”€ items/[id]/       Item details
â”‚   â”‚   â”‚   â”œâ”€â”€ low-stock/        Low-stock view
â”‚   â”‚   â”‚   â”œâ”€â”€ notifications/    Notifications
â”‚   â”‚   â”‚   â”œâ”€â”€ outstanding/      Checked-out items
â”‚   â”‚   â”‚   â”œâ”€â”€ reconciliation/   Stock reconciliation
â”‚   â”‚   â”‚   â”œâ”€â”€ settings/         Organization and account settings
â”‚   â”‚   â”‚   â”œâ”€â”€ team/             Team administration
â”‚   â”‚   â”‚   â”œâ”€â”€ transactions/     Stock movements
â”‚   â”‚   â”‚   â”œâ”€â”€ layout.tsx        Signed-in shell/navigation
â”‚   â”‚   â”‚   â””â”€â”€ ...               One `page.tsx` per route above
â”‚   â”‚   â”œâ”€â”€ (auth)/               Login, registration, invite and password routes
â”‚   â”‚   â”‚   â”œâ”€â”€ layout.tsx        Shared authentication shell
â”‚   â”‚   â”‚   â””â”€â”€ */page.tsx        login, register, accept-invite, forgot/reset-password
â”‚   â”‚   â”œâ”€â”€ (marketing)/          Public website routes
â”‚   â”‚   â”‚   â”œâ”€â”€ about/, blog/, contact/, legal/
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx           Landing page
â”‚   â”‚   â”‚   â””â”€â”€ layout.tsx        Public navigation/footer
â”‚   â”‚   â”œâ”€â”€ api/v1/[...path]/    Same-origin API proxy and session cookies
â”‚   â”‚   â”œâ”€â”€ globals.css           Global styles and theme tokens
â”‚   â”‚   â”œâ”€â”€ layout.tsx            Root metadata, providers, and PWA registration
â”‚   â”‚   â”œâ”€â”€ manifest.ts           Web app manifest
â”‚   â”‚   â”œâ”€â”€ robots.ts             Robots metadata
â”‚   â”‚   â””â”€â”€ sitemap.ts            Sitemap assembled from blog/legal content
â”‚   â”œâ”€â”€ components/              Shared UI and feature components
â”‚   â”‚   â”œâ”€â”€ ui.tsx                Form controls, tables, modal, toast primitives
â”‚   â”‚   â”œâ”€â”€ providers.tsx         React Query, auth, and toast providers
â”‚   â”‚   â”œâ”€â”€ auth-shell.tsx        Authentication page frame
â”‚   â”‚   â”œâ”€â”€ marketing.tsx         Marketing navigation and FAQ
â”‚   â”‚   â”œâ”€â”€ catalog.tsx           Shelf/category/item forms and cards
â”‚   â”‚   â”œâ”€â”€ items-table.tsx       Searchable/paginated item listing
â”‚   â”‚   â”œâ”€â”€ dashboard-analytics.tsx Dashboard metrics
â”‚   â”‚   â”œâ”€â”€ scan.tsx              Barcode scan and quick movement flow
â”‚   â”‚   â”œâ”€â”€ pickers.tsx           Item/holder selectors with cache fallback
â”‚   â”‚   â”œâ”€â”€ photo.tsx, media.tsx  Photo upload and image display
â”‚   â”‚   â””â”€â”€ ...                   Permission, PWA, sync, theme, and visual helpers
â”‚   â””â”€â”€ lib/                      Shared application logic and API client
â”‚       â”œâ”€â”€ api.ts                Fetch wrapper, errors, session hints, downloads
â”‚       â”œâ”€â”€ endpoints.ts          Typed `sk.*` endpoint facade
â”‚       â”œâ”€â”€ auth.tsx              Auth context and sign-out/session lifecycle
â”‚       â”œâ”€â”€ roles.ts              Client-side capability checks
â”‚       â”œâ”€â”€ offline.ts            Offline action queue and batch replay
â”‚       â”œâ”€â”€ quick.ts              Movement creation routed online or into queue
â”‚       â”œâ”€â”€ cache.ts              IndexedDB cache for offline lookups
â”‚       â”œâ”€â”€ blog.ts               Static blog content
â”‚       â”œâ”€â”€ legal-content.ts      Static legal page content
â”‚       â””â”€â”€ image.ts              Browser image compression
â”œâ”€â”€ Dockerfile                    Multi-stage production image
â”œâ”€â”€ next.config.ts                Next.js runtime/build configuration
â”œâ”€â”€ package.json                  Scripts and dependencies
â”œâ”€â”€ pnpm-lock.yaml                Locked dependency graph
â”œâ”€â”€ playwright.config.ts          E2E runner settings and server URLs
â”œâ”€â”€ tsconfig.json                 Strict TS and `@/*` alias to `src/*`
â”œâ”€â”€ IMAGES.md / IMAGE_PROMPTS.md  Marketing image inventory and prompts
â””â”€â”€ README.md                     Setup, feature, deployment, and test notes
```

## How the files connect

### Startup and page rendering

`src/app/layout.tsx` is the root layout. It loads global styles and wraps the app with `components/providers.tsx`, which wires TanStack Query, `lib/auth.tsx`, and toast UI. Next route groups organize pages without adding URL segments: `(marketing)` uses the public navigation/footer, `(auth)` uses the auth shell, and `(app)` supplies the authenticated workspace shell. Route `page.tsx` files compose shared components and call the endpoint facade.

### API and authentication

Feature pages/components call `sk.*` from `src/lib/endpoints.ts`. That facade uses `src/lib/api.ts`, which sends browser requests to this origin's `/api/v1/...`. `src/app/api/v1/[...path]/route.ts` forwards them server-side to the configured StoreKeeper API, adds the bearer token from the httpOnly `sk_session` cookie, and handles login/logout cookie changes. The API URL is server configuration; the browser does not call the upstream API directly.

`lib/auth.tsx` obtains the current user through the same facade and exposes session state. `components/restricted.tsx` combines that state with `lib/roles.ts` to hide or guard capabilities in the UI. The API remains the authorization authority.

### Shared feature logic

Catalog pages share forms and cards from `components/catalog.tsx`; item lists use `components/items-table.tsx`; scanner flows combine `components/scan.tsx`, `components/pickers.tsx`, and `lib/quick.ts`. Photo inputs use `components/photo.tsx` and compress images through `lib/image.ts` before upload. Marketing blog/legal routes read their content from `lib/blog.ts` and `lib/legal-content.ts`.

### Offline data flow

`lib/quick.ts` sends stock movements through `lib/offline.ts`. When the request is unavailable, the movement is persisted in local storage with an idempotency key; on reconnection, `offline.ts` replays queued work through `sk.sync.batch`. `components/sync-bar.tsx` surfaces queue state and conflicts. `lib/cache.ts` refreshes selected lookup data into IndexedDB; pickers and scanner code use this cache when network lookups fail. `public/sw.js` caches the app shell and visited pages in production and does not intercept API calls. PWA metadata comes from `src/app/manifest.ts`, with registration in `components/pwa.tsx` and icons in `public/icons/`.

### Build and end-to-end checks

`package.json` is the source of the `dev`, `build`, `start`, `typecheck`, and Playwright scripts. `next.config.ts` enables standalone output when `NEXT_OUTPUT=standalone`; `Dockerfile` uses that mode for its runtime image. `playwright.config.ts` points tests in `e2e/` at a running web app and API. Set `E2E_BASE_URL` and `E2E_API_URL` to override the local defaults.

## Change guide

- Add a URL by creating a route directory and `page.tsx` under the appropriate route group.
- Add or change an API operation in `src/lib/endpoints.ts`; keep transport/session behavior centralized in `src/lib/api.ts` and the proxy route.
- Put reusable UI in `src/components/`; keep domain/session/offline logic in `src/lib/`.
- Treat API authorization as authoritative even when a UI capability check is added.
- Update or add an E2E flow under `e2e/` when a user-facing workflow changes.

## Detailed area maps

- [Authentication flow](docs/architecture/auth-flow.md)
- [Role and capability access](docs/architecture/role-access.md)
- [Marketing website](docs/architecture/marketing-site.md)
- [Catalog management](docs/architecture/catalog.md)
- [Inventory item browsing and detail](docs/architecture/inventory-items.md)
- [Dashboard and analytics](docs/architecture/dashboard-analytics.md)
- [Checkout and return workflows](docs/architecture/checkout-returns.md)
- [Transactions and activity history](docs/architecture/transactions-activity.md)
- [Holders and team management](docs/architecture/holders-team.md)
- [Approval workflow](docs/architecture/approvals.md)
- [Notifications and sync status](docs/architecture/notifications.md)
- [Data imports](docs/architecture/imports.md)
- [Offline movement queue](docs/architecture/offline-queue.md)
- [Offline lookup cache](docs/architecture/offline-cache.md)
- [Barcode scanning and quick actions](docs/architecture/barcode-scanning.md)
- [Photos and media](docs/architecture/photos-media.md)
- [PWA, build, and browser checks](docs/architecture/pwa-build-e2e.md)

