# Authentication flow

Focused map for the existing StoreKeeper web application.

## Files

`src/app/(auth)/*/page.tsx`, `src/app/(auth)/layout.tsx`, `src/components/auth-shell.tsx`, `src/lib/auth.tsx`, `src/app/api/v1/[...path]/route.ts`, `src/lib/api.ts`, and `src/lib/endpoints.ts`.


## Runtime flow

Authentication pages call the `sk.auth` methods in `src/lib/endpoints.ts`. The API client targets the same-origin proxy. The proxy forwards to the upstream API and places returned session tokens in httpOnly cookies; `lib/auth.tsx` refreshes the current user and exposes session state to the UI.


## Extension notes

For a new sign-in or recovery step, add a route under `(auth)`, reuse `AuthShell`, and call the typed auth method through `sk`. Keep token handling inside the proxy and auth library. The matching browser scenarios live in `e2e/auth.spec.ts`.

