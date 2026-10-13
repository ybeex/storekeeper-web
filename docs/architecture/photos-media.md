# Photos and media

Focused map for the existing StoreKeeper web application.

## Files

`src/components/photo.tsx`, `media.tsx`, `catalog.tsx`, `src/lib/image.ts`, `endpoints.ts`, `src/app/(marketing)/` pages, `public/`, `IMAGES.md`, and `IMAGE_PROMPTS.md`.

## Runtime flow

`PhotoField` captures or selects an image, compresses it in the browser with `compressImage`, uploads it through `sk.files.upload`, and returns a file identifier. Catalog/item forms submit that identifier; media components display imagery, while marketing assets are served from public static paths.

## Extension notes

Use the shared photo input and compression helper instead of adding another upload path. Keep file IDs in feature payloads; uploads require a network connection. Update the image inventory when marketing assets or their slots change.

