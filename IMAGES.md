# Image slots

Public pages use designed placeholders until real photography is supplied. Ready-to-paste generation prompts for every slot are in `IMAGE_PROMPTS.md`.
To replace one, put the file in `public/images/` and pass `src="/images/<slot>.jpg"` to the matching `<Media>` in
`src/app/(marketing)/page.tsx` or `src/components/auth-shell.tsx`.

| Slot | Ratio | Brief |
|---|---|---|
| hero | 16:12 | Storekeeper at a site store counter handing a drill to a worker, tablet in hand |
| segment-construction / -maintenance / -factory / -workshop / -warehouse | 4:5 | One environment each, people at work |
| feature-scan | 4:3 | Hand scanning a QR tag on a power drill |
| feature-batch | 4:3 | Tablet with a batch checkout list beside issued tools |
| feature-outstanding | 4:3 | Supervisor reading the outstanding list on a phone |
| feature-reconcile | 4:3 | Storekeeper counting consumables with a tablet |
| role-storekeeper / -supervisor / -admin | 3:2 | One per role |
| cta | 21:9 | Calm, organised tool crib; leave the left side clear for text |
| auth-side | 3:4 | Moody shelving shot; keep the lower third calm |
| about-hero | 21:9 | Busy site tool crib mid-shift |
| about-story | 4:3 | Tool handed back across the counter |
| about-pilot | 4:3 | Tablet on a store counter with the outstanding list |
| contact | 4:5 | Friendly storekeeper portrait |
| blog-tools / blog-assets / blog-count | 16:10 | One cover per post |
