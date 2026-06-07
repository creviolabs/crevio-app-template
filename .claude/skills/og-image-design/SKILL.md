---
name: og-image-design
description: "Open Graph and social sharing image design for this Next.js App Router template, using next/og (ImageResponse via @vercel/og — Satori + resvg) and the opengraph-image / twitter-image file conventions. Covers static OG files, dynamic per-route generation, metadata, platform specs, layout, and branding. Use for: social sharing images, blog thumbnails, link previews, social cards. Triggers: og image, open graph, social sharing image, twitter card, social card, link preview image, og meta, sharing preview, social thumbnail, meta image, og:image, twitter:image, linkedin preview, opengraph-image, next/og, ImageResponse"
---

# OG Image Design

Create social sharing images (Open Graph) the Next.js-native way: file conventions in the `app/` directory. Static images for fixed routes, generated images (`next/og`) for data-driven routes like blog posts and products.

Next.js automatically injects the `<meta property="og:image">` and `<meta name="twitter:image">` tags — including width, height, and type — for any `opengraph-image` / `twitter-image` file it finds. You do **not** hand-write image meta tags. Absolute URLs resolve against `metadataBase`, which is already set in [`app/layout.tsx`](../../../app/layout.tsx).

## What this template ships

A site-wide generated card at [`app/opengraph-image.tsx`](../../../app/opengraph-image.tsx). It renders the account's name + description on a dark gradient and applies to **every route** unless a deeper file overrides it. The root layout sets `twitter: { card: "summary_large_image" }` so X shows the full-width card.

**It's a starting point, not a finished design.** It's deliberately generic so a freshly cloned site has a real card on day one — then you brand it.

## Building / rebranding the landing page

Treat the social card as part of the landing-page pass — it's the first impression in every shared link, DM, Slack unfurl, and search preview. When you build or restyle the homepage:

1. Open [`app/opengraph-image.tsx`](../../../app/opengraph-image.tsx) and match it to the site you're building — see the `TEMPLATE:` notes inline.
2. Pull the **background and accent colors** from the same palette as the page (the oklch theme in `app/app.css`). Convert to hex/rgb — Satori doesn't understand `oklch()` or CSS variables.
3. Write a **headline that sells the click** — usually the same value proposition as the hero, not just the site name.
4. Swap the avatar for a real **logo** (inline SVG or a fetched `<img>`) if you have one.
5. Preview at `/opengraph-image` in `bun run dev`, then validate with the tools below.

## Two approaches

| Approach | File | Use when |
|----------|------|----------|
| **Static** | `opengraph-image.png` (a real image file) | The image never changes for the route (home, pricing, about) |
| **Generated** | `opengraph-image.tsx` (returns `ImageResponse`) | The image depends on data (blog post title, product name/price) |

The more specific file wins: an `opengraph-image` deeper in the tree overrides one above it. A root `app/opengraph-image.png` is the site-wide fallback.

## Static Open Graph images

Drop an image file into the route's folder. No code, no meta tags.

```
app/
├── opengraph-image.png        # site-wide default (1200×630)
├── opengraph-image.alt.txt    # alt text: "Crevio — the AI that runs your business"
├── pricing/
│   └── opengraph-image.png    # overrides the default for /pricing
```

- Supported formats: `.png`, `.jpg`/`.jpeg`, `.gif`. Use `.png` (or optimized `.jpg`) at **1200×630**.
- `opengraph-image.alt.txt` (sibling file) sets the alt text.
- Same convention for Twitter: `twitter-image.png` + `twitter-image.alt.txt`. **If you omit `twitter-image`, Twitter falls back to your `opengraph-image`** — so a single OG file usually covers both. Adding any `twitter-image` makes Next.js emit `summary_large_image` automatically.

> **Deployment note:** this template runs Next.js via `vinext` on Cloudflare Workers. Static `opengraph-image` files are the most robust option there (served as plain assets) and skip per-request rendering. Use them for fixed marketing routes where the design is locked; use generated images when the card depends on data.

## Generated Open Graph images (`next/og`)

An `opengraph-image.tsx` exports `size`, `contentType`, optional `alt`, and a default function returning an `ImageResponse`. `ImageResponse` uses [Satori + resvg](https://vercel.com/docs/og-image-generation) to render a **flexbox subset** of HTML/CSS to PNG.

### Site-wide card (the shipped template)

The whole-site card lives at [`app/opengraph-image.tsx`](../../../app/opengraph-image.tsx) and reuses `getAccount()` from [`@/lib/data`](../../../lib/data.ts) so there are no extra API calls. This is the file you brand during the landing-page pass — colors, logo, and headline. Simplified shape:

```tsx
// app/opengraph-image.tsx — applies to every route unless overridden
import { ImageResponse } from "next/og";
import { getAccount } from "@/lib/data";
import { getAppUrl } from "@/lib/site-url";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Social sharing image";

export default async function Image() {
	const account = await getAccount().catch(() => null);
	const name = account?.name ?? "Crevio";
	const tagline = account?.description ?? ""; // TEMPLATE: or a fixed tagline
	const host = getAppUrl().replace(/^https?:\/\//, "");

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: 80,
					background: "linear-gradient(135deg, #0b0b0f 0%, #1a1a2e 100%)", // TEMPLATE: brand colors
					color: "white",
					fontFamily: "system-ui, sans-serif",
				}}
			>
				<div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>{name}</div>
				<div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.1, maxWidth: 920 }}>
					{tagline || name}
				</div>
				<div style={{ display: "flex", fontSize: 24, opacity: 0.6 }}>{host}</div>
			</div>
		),
		{ ...size },
	);
}
```

### Per-route override (data-driven)

For routes whose card should differ — blog posts, products — add an `opengraph-image.tsx` in that folder. The deepest file wins, so this overrides the site-wide one for matching routes:

```tsx
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { getAccount, getBlogPost } from "@/lib/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Blog post";

export default async function Image({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const [account, post] = await Promise.all([getAccount(), getBlogPost(slug)]);

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: 80,
					background: "linear-gradient(135deg, #0f0f0f, #1a1a2e)",
					color: "white",
					fontFamily: "system-ui",
				}}
			>
				<div style={{ display: "flex", fontSize: 22, textTransform: "uppercase", letterSpacing: 2, opacity: 0.7 }}>
					{account.name}
				</div>
				<div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>
					{post.title}
				</div>
				<div style={{ display: "flex", fontSize: 24, opacity: 0.8 }}>{post.excerpt ?? ""}</div>
			</div>
		),
		{ ...size },
	);
}
```

> **Satori gotchas:**
> - Only **flexbox** and a CSS subset — no `display: grid`, no `gap` on some versions (use margins), no float.
> - Every element with children that wraps multiple nodes needs an explicit `display: flex` (Satori requires it).
> - No external `next/font` magic — load custom fonts by fetching the `.woff`/`.ttf` as an `ArrayBuffer` and passing it via the `fonts` option (see below). Without that you get `system-ui`, which renders fine but plainly.
> - Keep it self-contained: this file runs in an isolated rendering context, not your React tree.

### Loading a custom font

```tsx
const font = await fetch(new URL("./Inter-Bold.ttf", import.meta.url)).then((r) =>
	r.arrayBuffer(),
);

return new ImageResponse(<div style={{ fontFamily: "Inter" }}>…</div>, {
	...size,
	fonts: [{ name: "Inter", data: font, weight: 700, style: "normal" }],
});
```

### Multiple images per route

Export `generateImageMetadata()` to emit several images (e.g. one per locale) from a single file — each gets an `id` passed to the default `Image({ id })` function.

## How this template wires metadata

`metadataBase` is set once in [`app/layout.tsx`](../../../app/layout.tsx), so all image URLs resolve to absolute. With file-convention images you **don't** add `openGraph.images` / `twitter.images` manually — Next.js does it. The same layout sets `twitter: { card: "summary_large_image" }`, so the site-wide card renders full-width on X everywhere.

A page can still override the card type. For example, [`app/blog/[slug]/page.tsx`](../../../app/blog/[slug]/page.tsx) sets `twitter: { card: "summary" }`; once that route has its own `opengraph-image.tsx`, drop that line so it inherits the large card, or keep it intentionally small for text-heavy posts:

```tsx
twitter: { card: "summary_large_image" },
```

Only set `openGraph.images` by hand if the image is hosted **outside** the app (e.g. a Crevio CDN URL from the SDK):

```tsx
openGraph: { images: [{ url: post.coverImageUrl, width: 1200, height: 630 }] },
```

## Platform Specifications

| Platform | Dimensions | Aspect Ratio | File Size | Format |
|----------|-----------|--------------|-----------|--------|
| **Facebook** | 1200 × 630 px | 1.91:1 | < 8 MB | JPG, PNG |
| **Twitter/X (summary_large_image)** | 1200 × 628 px | 1.91:1 | < 5 MB | JPG, PNG, WEBP, GIF |
| **Twitter/X (summary)** | 800 × 418 px | 1.91:1 | < 5 MB | JPG, PNG |
| **LinkedIn** | 1200 × 627 px | 1.91:1 | < 5 MB | JPG, PNG |
| **Discord** | 1200 × 630 px | 1.91:1 | < 8 MB | JPG, PNG |
| **Slack** | 1200 × 630 px | 1.91:1 | — | JPG, PNG |
| **iMessage** | 1200 × 630 px | 1.91:1 | — | JPG, PNG |

**Universal safe bet: 1200 × 630 px, PNG, under 5 MB.** This is the default `size` for `ImageResponse` above.

## The Golden Layout

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  ┌─────────────────────────────────┐  ┌───────┐  │
│  │                                 │  │       │  │
│  │  Title Text (max 60 chars)      │  │ Logo/ │  │
│  │  ───────────────────            │  │ Visual│  │
│  │  Subtitle (max 100 chars)       │  │       │  │
│  │                                 │  │       │  │
│  │  author / site name             │  └───────┘  │
│  └─────────────────────────────────┘             │
│                                                  │
└──────────────────────────────────────────────────┘
  1200 × 630 px
```

## Design Rules

### Text

| Rule | Value |
|------|-------|
| Title font size | 48-64px |
| Subtitle font size | 20-28px |
| Max title length | 60 characters (truncated on some platforms) |
| Max subtitle length | 100 characters |
| Line height | 1.1-1.3 for titles |
| Font weight | Bold/Black for title, Regular for subtitle |
| Text contrast | WCAG AA minimum (4.5:1 ratio) |

### Safe Zones

- 40-80px minimum padding from all edges
- Some platforms crop edges or add rounded corners
- Never put critical text in the outer 5%

### Colors

| Background Type | When to Use |
|----------------|-------------|
| Solid brand color | Consistent series, corporate |
| Gradient | Modern, eye-catching |
| Photo with overlay | Blog posts, editorial |
| Dark background | Better contrast, stands out in feeds |

**Dark backgrounds outperform light** in social feeds — most feeds are white/light, so dark OG images pop.

## Consistency System

For a site with many generated images, factor the shared chrome into one helper and vary only the content:

| Element | Keep Consistent | Vary |
|---------|----------------|------|
| Background style | Same gradient / brand colors | — |
| Font family | Same font | — |
| Layout | Same positioning | — |
| Logo / branding | Same placement (corner) | — |
| Category badge | Same style | Color per category |
| Title text | Same size/weight | Content changes |

## Testing OG Images

Generated images render at `/<route>/opengraph-image` in dev — open that URL directly to preview before deploying. Then validate the live page:

| Tool | URL |
|------|-----|
| Facebook Debugger | developers.facebook.com/tools/debug/ |
| LinkedIn Post Inspector | linkedin.com/post-inspector/ |
| OpenGraph.xyz | opengraph.xyz |
| Vercel OG Playground | og-playground.vercel.app |

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Hand-writing `og:image` meta tags | Duplicates / conflicts with file convention | Let the `opengraph-image` file emit them |
| Missing `metadataBase` | Image URLs stay relative, platforms can't fetch | Already set in `app/layout.tsx` — keep it |
| `display: grid` in `ImageResponse` | Satori silently misrenders | Flexbox only |
| Missing `display: flex` on a multi-child node | Satori throws at render time | Add `display: flex` explicitly |
| `twitter: { card: "summary" }` with a large image | Tiny thumbnail instead of full card | Use `summary_large_image` or omit and rely on the file convention |
| Text too small | Unreadable on mobile previews | Title minimum 48px at 1200px width |
| Light background | Gets lost in white/light feeds | Use dark or saturated backgrounds |
| Heavy fetches in `opengraph-image.tsx` | Slow image generation, bot timeouts | Reuse cached `@/lib/data` loaders; keep it lean |

## References

- [Next.js: Metadata & OG images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [opengraph-image & twitter-image file conventions](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [ImageResponse API](https://nextjs.org/docs/app/api-reference/functions/image-response)
- [@vercel/og generation](https://vercel.com/docs/og-image-generation)
