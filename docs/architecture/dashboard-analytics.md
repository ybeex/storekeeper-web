# Dashboard and analytics

Focused map for the existing StoreKeeper web application.

## Files

`src/app/(app)/dashboard/page.tsx`, `src/app/(app)/insights/page.tsx`, `src/components/dashboard-analytics.tsx`, `src/lib/endpoints.ts`, `src/lib/api.ts`, and `src/lib/roles.ts`.


## Runtime flow

The dashboard route composes summary cards and `DashboardAnalytics`. That component queries `sk.views.dashboardAnalytics`, keyed by the requested time window, and refreshes on an interval. Insights uses its own view endpoints and capability checks.


## Extension notes

For another dashboard metric, add the typed view response/method in `endpoints.ts`, query it with a stable React Query key, and render loading/error states. Keep restricted analytics links and routes aligned with the capability map.

