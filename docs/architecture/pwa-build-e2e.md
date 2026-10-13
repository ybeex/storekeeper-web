# PWA, build, and browser checks

Focused map for the existing StoreKeeper web application.

## Files

`src/app/layout.tsx`, `manifest.ts`, `src/components/pwa.tsx`, `public/sw.js`, `public/offline.html`, `public/icons/`, `package.json`, `next.config.ts`, `Dockerfile`, `playwright.config.ts`, and `e2e/`.

## Runtime flow

The root layout publishes metadata and registers the service worker through `SwRegister`; the manifest and icons enable installation. The worker caches the app shell and visited pages in production, not API requests. Package scripts drive Next build/typecheck and Playwright; Docker builds standalone output and runs the server.

## Extension notes

Keep the service worker disabled in development and avoid caching API responses. Update manifest/icon assets together when app identity changes. E2E tests require a running web server and API; set their URLs through the documented environment variables. Build/runtime configuration is split between Next config and Docker stages.

