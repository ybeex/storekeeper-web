# Approval workflow

Focused map for the existing StoreKeeper web application.

## Files

`src/app/(app)/approvals/page.tsx`, `src/components/restricted.tsx`, `src/lib/auth.tsx`, `src/lib/roles.ts`, `src/lib/endpoints.ts`, and `src/components/ui.tsx`.


## Runtime flow

The approvals page queries the approval queue and uses mutations for approve, reject, and cancel. Capability checks control which actions appear. Shared tabs, tables, buttons, dialogs, and toast feedback come from the component layer.


## Extension notes

Add approval states/actions to the typed endpoint facade and reflect permitted actions in the UI. Ensure mutation success invalidates the queue and related activity data. Treat UI role checks as presentation only; the API must authorize the decision.

