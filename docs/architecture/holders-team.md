# Holders and team management

Focused map for the existing StoreKeeper web application.

## Files

`src/app/(app)/holders/page.tsx`, `team/page.tsx`, `src/components/pickers.tsx`, `resource.tsx`, `restricted.tsx`, `src/lib/endpoints.ts`, `auth.tsx`, and `roles.ts`.


## Runtime flow

Holder and team pages load records through the endpoint facade and reusable resource/table UI. Movement forms use holder pickers, which query the API and can fall back to cached holders. Team mutations and management controls are limited by the current user capability.


## Extension notes

Use `Resource` for standard CRUD tables and `HolderPicker` for movement forms. Add the endpoint and role capability before exposing a new management action, then invalidate list/detail queries after a write.

