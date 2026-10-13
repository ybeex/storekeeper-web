# Marketing website

Focused map for the existing StoreKeeper web application.

## Files

`src/app/(marketing)/` route pages and layout, `src/components/marketing.tsx`, `media.tsx`, `motion.tsx`, `contact-form.tsx`, `src/lib/blog.ts`, `src/lib/legal-content.ts`, `sitemap.ts`, and `public/` imagery.


## Runtime flow

The route group supplies landing, about, contact, blog, and legal pages without adding a URL segment. The shared layout wraps them in marketing navigation and footer. Blog/legal data comes from local lib modules; contact form sends `sk.public.contact`; sitemap imports the blog and legal catalogs.


## Extension notes

Add static content to the matching lib catalog and link it from the route. Add a dedicated page under `(marketing)` for new URL structure, and use shared media/motion components where useful. Update sitemap generation when introducing indexable content.

