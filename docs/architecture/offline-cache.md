# Offline lookup cache

Focused map for the existing StoreKeeper web application.

## Files

`src/lib/cache.ts`, `api.ts`, `endpoints.ts`, `auth.tsx`, `src/components/pickers.tsx`, `scan.tsx`, and `src/app/(app)/settings/page.tsx`.

## Runtime flow

`cache.ts` refreshes selected item, people, team, and job data from typed endpoints into IndexedDB. Pickers and scanner lookup catch network failures and use cached values. Auth sign-out clears the cache, and account settings expose refresh/cache information.

## Extension notes

Only cache data needed for offline lookup. Update the cache refresh/expiry path when adding a dataset and ensure sign-out removes user-scoped data. Keep network error detection centralized so API errors are not mistaken for connectivity failures.

