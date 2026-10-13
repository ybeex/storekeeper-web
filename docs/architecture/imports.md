# Data imports

Focused map for the existing StoreKeeper web application.

## Files

`src/app/(app)/imports/page.tsx`, `src/lib/endpoints.ts`, `api.ts`, `src/components/ui.tsx`, `src/components/restricted.tsx`, and `src/lib/roles.ts`.


## Runtime flow

The import route collects or selects input, calls the import-related typed endpoint, and presents validation/result state with shared controls. The API helper centralizes request errors and file download/upload support. Capability checks determine whether the route/actions are available.


## Extension notes

Keep file transfer and endpoint payload details in the API facade. Present row-level validation and final result states in the route, and gate the action with the matching capability. Do not put credentials or import files into browser cache.

