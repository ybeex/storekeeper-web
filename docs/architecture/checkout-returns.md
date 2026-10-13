# Checkout and return workflows

Focused map for the existing StoreKeeper web application.

## Files

`src/app/(app)/outstanding/page.tsx`, `transactions/page.tsx`, `src/components/scan.tsx`, `pickers.tsx`, `items-table.tsx`, `src/lib/quick.ts`, `offline.ts`, and `endpoints.ts`.


## Runtime flow

A user selects or scans an item and holder, then the quick movement helper creates an action. It submits through `sk.transactions` when online or persists it through the offline queue. Outstanding displays current checkouts and offers return actions; the API remains the source of movement state.


## Extension notes

Add a movement type through the shared endpoint and action model, preserving idempotency keys for retries. Use the shared item/holder pickers and make online-only constraints explicit. Checkout and return coverage lives in `e2e/checkout.spec.ts`.

