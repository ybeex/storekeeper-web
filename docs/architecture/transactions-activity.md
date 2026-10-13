# Transactions and activity history

Focused map for the existing StoreKeeper web application.

## Files

`src/app/(app)/transactions/page.tsx`, `activity/page.tsx`, `src/lib/endpoints.ts`, `api.ts`, `offline.ts`, `quick.ts`, and `src/components/ui.tsx`.


## Runtime flow

Transaction routes query movement endpoints and render shared tables. Activity composes activity/audit feeds, exports via the API helper, and displays unresolved sync conflicts. Conflict resolution calls `sk.sync.resolve`; sync queue state is also surfaced by `components/sync-bar.tsx`.


## Extension notes

Add new event views through typed endpoint methods and stable query keys. Keep CSV/download handling centralized in `api.ts`. When presenting queued conflicts, link the action to the sync-resolution endpoint and refresh the affected feed after resolution.

