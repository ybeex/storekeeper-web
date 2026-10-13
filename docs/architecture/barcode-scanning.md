# Barcode scanning and quick actions

Focused map for the existing StoreKeeper web application.

## Files

`src/components/scan.tsx`, `pickers.tsx`, `quick.ts`, `offline.ts`, `cache.ts`, `restricted.tsx`, `src/lib/endpoints.ts`, and `src/components/ui.tsx`.

## Runtime flow

The scanner reads a supported browser barcode format or accepts typed input, resolves the value with the item lookup endpoint (and cache fallback), then offers a movement appropriate to item type and user capability. It reuses item/holder pickers and sends movement through the online/offline quick-action path.

## Extension notes

Keep camera lifecycle and code parsing in `scan.tsx`; keep movement submission in `quick.ts`. Provide a keyboard/manual fallback when browser camera/barcode APIs are unavailable, and preserve permission checks and offline idempotency.

