# Image generation prompts

Prompts for every image slot on the public pages. They are written to work in Midjourney, Flux, DALL-E style tools
and similar. Generate four variants per slot, pick the most believable, and fix hands, tools and text artefacts
before shipping. Save as JPG or WebP, under about 300 KB, at the pixel size listed, in `public/images/<slot>.jpg`.

## Shared look (append to every prompt)

**Style suffix**
> Documentary photography, natural available light, 35mm lens, shallow depth of field, honest and unposed, real working environment, muted steel-grey and concrete palette with deep maroon and amber-yellow accents, subtle film grain, high detail, no text, no logos, no watermarks.

**Negative prompt**
> text, letters, signage, brand names, logos, watermark, stock-photo smiles, staged poses, extra fingers, deformed hands, melted or fused tools, floating objects, plastic skin, oversaturated colours, fisheye distortion, cartoon, illustration, CGI render look.

**Rules for the set**
- People wear correct PPE for the setting (hard hat, hi-vis, safety glasses, gloves) and handle tools safely.
- Mix of ages, genders and ethnicities, shown at work rather than looking at the camera.
- Screens show only abstract, unreadable interface shapes (rows and coloured pills), never legible text.
- Keep tags and labels blank or as plain QR squares.
- Leave the calm area noted in a prompt clear, because the page overlays text there.
- Same grade across the set: cool shadows, warm highlights, one accent colour per frame.

## Home page

| Slot | Size (px) | Ratio |
|---|---|---|
| `hero` | 2000 x 1500 | 4:3 |

**hero** alt: "Storekeeper issuing a tool at the store counter"
> A storekeeper in a hi-vis vest at the counter of a construction site tool store, handing a cordless drill across to a worker in a hard hat, a tablet in the storekeeper's other hand, orderly pegboard and steel shelving behind with tools in neat rows, late-morning window light from the left, counter in the foreground slightly out of focus, warm and capable mood. {style suffix}

| Slot | Size (px) | Ratio | Prompt |
|---|---|---|---|
| `segment-construction` | 1200 x 1500 | 4:5 | A construction site store container with its shutter open, a storekeeper and a worker discussing at the counter, scaffolding and a crane softly out of focus behind. |
| `segment-maintenance` | 1200 x 1500 | 4:5 | A maintenance technician in coveralls taking a labelled tool case from a shelf in a plant-room workshop, pipes and a distribution board in the background. |
| `segment-factory` | 1200 x 1500 | 4:5 | A clean factory tooling crib with wall-mounted tool shadow boards, a technician in safety glasses selecting a torque wrench, production line blurred in the distance. |
| `segment-workshop` | 1200 x 1500 | 4:5 | A small independent workshop bench at golden hour, hand tools hung on a pegboard, a craftsperson checking a tablet beside a vice, warm wood and steel. |
| `segment-warehouse` | 1200 x 1500 | 4:5 | A warehouse equipment cage with ladders, pallet jacks and labelled bins, a worker in hi-vis scanning a shelf with a handheld device, tall racking receding behind. |

Each segment prompt ends with: `{style suffix}`. Alt text: the segment name plus "at work".

## Feature rows

| Slot | Size (px) | Ratio | Prompt |
|---|---|---|---|
| `feature-scan` | 1600 x 1200 | 4:3 | Extreme close-up of a gloved hand holding a phone, scanning a plain black-and-white QR tag stuck to the housing of a yellow power drill, store shelving softly blurred behind, a thin beam of window light across the tool. |
| `feature-batch` | 1600 x 1200 | 4:3 | A tablet leaning on a store counter showing a simple checklist of rows with maroon ticks (no readable text), beside a neat stack of issued kit: hard hat, safety glasses, gloves, a drill and a coiled extension cable. |
| `feature-outstanding` | 1600 x 1200 | 4:3 | A site supervisor in a hard hat standing at a site gate, reading a phone with a list of coloured status pills, a row of containers and parked machinery behind, overcast daylight. |
| `feature-reconcile` | 1600 x 1200 | 4:3 | A storekeeper crouching at a low shelf counting boxes of fasteners, tablet in one hand, boxes labelled with plain blank white tags, shallow depth of field, calm focused mood. |

Append `{style suffix}`. Alt text: the row title.

## Roles

| Slot | Size (px) | Ratio | Prompt |
|---|---|---|---|
| `role-storekeeper` | 1500 x 1000 | 3:2 | A storekeeper behind a store counter with a tablet and scanner, a queue of two workers blurred in front, efficient and relaxed. |
| `role-supervisor` | 1500 x 1000 | 3:2 | A site supervisor in a hard hat reviewing a tablet beside a store container door, plans pinned inside, confident, three-quarter view. |
| `role-admin` | 1500 x 1000 | 3:2 | An operations manager at a tidy site-office desk with a laptop and a mug, a window onto the yard with machinery in the background, calm morning light. |

Append `{style suffix}`.

## Banners and sign-in

| Slot | Size (px) | Ratio | Prompt |
|---|---|---|---|
| `cta` | 2520 x 1080 | 21:9 | A calm, immaculate tool crib seen from the entrance: labelled shelves receding into depth, tools aligned, warm overhead light, polished concrete floor. **Keep the left 40% of the frame clear and quiet** for overlaid text. |
| `auth-side` | 1200 x 1600 | 3:4 | A tall, moody view of well-organised steel tool shelving with a single rim light from the side, tools in shadow boards, deep maroon and steel. **Keep the lower third dark and calm** for an overlaid line of text. |

Append `{style suffix}`.

## Company pages

| Slot | Size (px) | Ratio | Prompt |
|---|---|---|---|
| `about-hero` | 2520 x 1080 | 21:9 | A wide documentary frame of a busy site tool crib mid-shift: a storekeeper at the counter, a worker collecting equipment, a second worker returning a ladder, labelled shelving, honest and lived-in. |
| `about-story` | 1600 x 1200 | 4:3 | A close, human moment: a worker's gloved hands passing a power tool back across a store counter to a storekeeper, a tablet on the counter, faces mostly out of frame. |
| `about-pilot` | 1600 x 1200 | 4:3 | A tablet propped on a store counter showing a list of coloured status pills (no readable text), a folded hi-vis vest and a tape measure beside it, morning light. |
| `contact` | 1200 x 1500 | 4:5 | A friendly, candid portrait of a storekeeper at the counter looking slightly off-camera and smiling, pegboard of tools behind, warm window light. |

Append `{style suffix}`.

## Blog covers

Shown at 16:10 on the cards and 16:9 on the article. Keep the subject centred with a safe margin. Size 1600 x 1000.

| Slot | Prompt |
|---|---|
| `blog-tools` | Overhead shot of a cluttered site store counter: a paper notebook, a pen, a cordless drill and a worker's hand reaching for it, slightly chaotic but real. |
| `blog-assets` | Flat lay on a concrete surface: a power drill with a plain QR tag beside a small open box of bolts and a pair of work gloves, tidy and graphic, soft top light. |
| `blog-count` | A storekeeper counting boxes on a shelf with a tablet, side-on, shallow depth of field, rows of labelled boxes receding. |

Append `{style suffix}`.

## Checklist before shipping

- No legible text, logos or brand marks anywhere in frame.
- Hands, tools and PPE look correct at full size.
- Overlay areas (`cta`, `auth-side`) are genuinely clear.
- Compressed under 300 KB, and `alt` text on the page matches the picture.
- Wire up: pass `src="/images/<slot>.jpg"` to the matching `<Media>`.
