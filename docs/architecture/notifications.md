# Notifications and sync status

Focused map for the existing StoreKeeper web application.

## Files

`src/app/(app)/notifications/page.tsx`, `src/components/sync-bar.tsx`, `providers.tsx`, `src/lib/endpoints.ts`, `offline.ts`, and `api.ts`.


## Runtime flow

The notifications route queries the notification endpoints and renders state through shared UI. The sync bar observes the offline queue and presents pending work or conflicts. React Query providers establish client cache state for both views.


## Extension notes

Add notification types to endpoint/result typing and present unread/loading/error states in the route. Keep queue status sourced from the offline module rather than duplicating it in notification UI. Refresh affected query keys after a user marks an item read.

