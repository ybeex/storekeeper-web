# Role and capability access

Focused map for the existing StoreKeeper web application.

## Files

`src/lib/roles.ts`, `src/components/restricted.tsx`, `src/lib/auth.tsx`, `src/app/(app)/layout.tsx`, and capability-aware app pages such as approvals, imports, insights, catalog, and team.


## Runtime flow

The auth context provides the current user and role. `roles.ts` maps roles to capabilities; `restricted.tsx` exposes `useCan` and UI guards. Route pages use these checks to hide or disable actions. The upstream API independently enforces permissions and remains authoritative.


## Extension notes

When adding a capability, define its role mapping in `roles.ts`, guard the relevant UI with `useCan` or the restriction component, and preserve server-side API enforcement. Check both allowed and denied roles in the feature flow.

