# Inventory item browsing and detail

Focused map for the existing StoreKeeper web application.

## Files

`src/app/(app)/items/[id]/page.tsx`, `low-stock/page.tsx`, `catalog/page.tsx`, `src/components/items-table.tsx`, `catalog.tsx`, `badge.tsx`, `photo.tsx`, and `src/lib/endpoints.ts`.


## Runtime flow

The item listing and detail routes query typed item endpoints. `ItemsTable` handles filters and cursor pagination, uses catalog components to render item covers, and links to item detail. Low-stock and catalog routes use the same item API facade and shared row types.


## Extension notes

Add item fields to the shared row/types or endpoint payloads where needed, then update table/detail rendering. Keep list query keys and pagination behavior consistent. Item workflow browser coverage is in `e2e/checkout.spec.ts`.

