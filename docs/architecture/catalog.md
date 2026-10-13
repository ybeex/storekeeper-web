# Catalog management

Focused map for the existing StoreKeeper web application.

## Files

`src/app/(app)/catalog/page.tsx`, `catalog/categories/[categoryId]/page.tsx`, `catalog/shelves/[shelfId]/page.tsx`, `src/components/catalog.tsx`, `appearance.tsx`, `photo.tsx`, `src/lib/endpoints.ts`, and `roles.ts`.


## Runtime flow

Catalog route pages load shelf/category data through `sk.*`, then compose cards, modals, and forms from `components/catalog.tsx`. Those components use typed endpoint methods and shared UI primitives. Permission checks gate edits; item and category imagery flows through `PhotoField`.


## Extension notes

Add catalog routes alongside the existing catalog routes and keep reusable create/edit forms in `components/catalog.tsx`. Put new transport operations in `endpoints.ts`; invalidate the affected React Query keys after mutations and preserve capability checks.

