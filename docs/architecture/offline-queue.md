# Offline movement queue

Focused map for the existing StoreKeeper web application.

## Files

`src/lib/offline.ts`, `quick.ts`, `api.ts`, `endpoints.ts`, `src/components/sync-bar.tsx`, `src/app/(app)/activity/page.tsx`, and `e2e/offline.spec.ts`.


## Runtime flow

Movement helpers call submitOrQueue. Network failures persist an action locally with an idempotency key. On reconnection, the queue is sent as a batch through sk.sync.batch; results update queue state and conflicts can be reviewed in Activity. Sign-out clears auth/cache state while retaining queued actions.

## Extension notes

Preserve idempotency and replay semantics when changing queued payloads. Keep operations that need immediate server validation online-only. Extend the offline E2E scenario for any workflow that should queue and sync.

