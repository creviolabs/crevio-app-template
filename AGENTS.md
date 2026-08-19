# AGENTS.md

Guidance for AI agents working in this repo. Overrides any parent `AGENTS.md` (e.g. `crevio-app/AGENTS.md`) — this is a TanStack Start project, not Rails.

## Commands

```bash
bun run dev          # Vite dev server (TanStack Start + Cloudflare Workers runtime)
bun run typecheck    # wrangler types + tsc
bun run check        # biome check --write --unsafe . (auto-fixes lint + format)
bun run build        # typecheck, then production build
bun run preflight    # serve real requests through the BUILT worker in workerd
```

## Git

Never run interactive git commands — sandbox shells have no TTY and `$GIT_EDITOR` is unset. They will fail with `Standard input is not a terminal`.

Forbidden:
- `git rebase -i`
- `git add -i` / `git add -p`
- `git commit` without `-m` / `-F`

For rewriting history non-interactively, use `GIT_SEQUENCE_EDITOR=:` and `GIT_EDITOR=:` to no-op the editor, or prefer `git reset --soft` + fresh commits.

## Stack

- TanStack Start (TanStack Router + Vite) deployed to Cloudflare Workers
- React 19 + TypeScript
- Shadcn/UI (in `src/components/ui/`) — biome lint disabled there, do not edit
- TailwindCSS 4 with theme via CSS variables (oklch) in `src/styles/app.css`
- Data layer via `@crevio/sdk`, wrapped as server functions in `src/lib/data.ts`

## Layout

```
src/
  routes/       # every route file (see the table below)
                #   _marketing / _auth / _gated are pathless layouts:
                #   chrome + gating, no URL segment of their own
  components/   # shared components; components/ui is Shadcn, do not edit
  lib/          # data, session, seo, helpers
  hooks/
  config/       # features.ts
  styles/       # app.css
  router.tsx
  routeTree.gen.ts
public/         # served as-is at the site root
test/           # smoke.test.ts — the pre-deploy check (node --test)
```

`@/*` resolves to `src/*` — import across directories with `@/lib/data`, never a relative `../../lib/data`.

## Routing

Routes are files under `src/routes/`, compiled into `src/routeTree.gen.ts` (generated — never edit it, and it IS committed so `tsc` can run before the build). This is TanStack Start's default layout, so `tanstackStart()` needs no directory options.

| Route                  | File                                |
| ---------------------- | ----------------------------------- |
| root document | `src/routes/__root.tsx` |
| `/` | `src/routes/_marketing/index.tsx` |
| storefront chrome | `src/routes/_marketing.tsx` (pathless layout) |
| `/products/:slug` | `src/routes/_marketing/products/$slug.tsx` |
| `/blog` | `src/routes/_marketing/blog.tsx` (gate) + `blog/index.tsx` |
| `/blog/:slug` | `src/routes/_marketing/blog/$slug.tsx` |
| `/legal/:slug` | `src/routes/_marketing/legal.tsx` (gate) + `legal/$slug.tsx` |
| `/login` | `src/routes/_auth/login.tsx` |
| `/dashboard` | `src/routes/_gated.tsx` (gate + shell) + `_gated/dashboard.tsx` |
| `/robots.txt` | `src/routes/robots[.]txt.ts` |
| `/sitemap.xml` | `src/routes/sitemap[.]xml.ts` |
| `/api/og` | `src/routes/api/og.tsx` |

Conventions: `_name.tsx` is a pathless layout (chrome without a URL segment), `$param` is a dynamic segment, and `[.]` escapes a literal dot. Everything else under `src/routes/` becomes a route, so shared code lives beside it in `src/components/`, `src/lib/`, `src/hooks/`, `src/config/` — to colocate a component next to its route instead, prefix it with `-` to opt it out of routing.

## Data loading

**There are no async server components.** A page component is a plain function; everything it needs comes from the route's `loader`.

```tsx
export const Route = createFileRoute("/_marketing/blog/")({
  loader: () => getBlogPosts(),
  head: ({ loaderData }) => ({ meta: seo({ title: "Blog" }) }),
  component: BlogIndex,
});

function BlogIndex() {
  const posts = Route.useLoaderData();
}
```

Everything in `src/lib/data.ts` is a **server function** (`createServerFn`): it runs in-process during SSR and over an RPC on client-side navigation, so `CREVIO_API_KEY` never reaches the browser. Call one with its argument wrapped in `data`: `getProduct({ data: { slug } })`.

Never call the SDK from a component. Add a new read to `src/lib/data.ts` and load it from a route.

`get`-style readers throw `notFound()` for a slug the API doesn't have, so a loader just calls them — no `.catch(() => null)` then `throw notFound()`. Use `getAccountOrNull()` for chrome that must render regardless. A route that needs data its parent layout already loaded should read it off `parentMatchPromise` rather than fetching it again — nothing dedupes reads for you.

There is no response cache of any kind — every read is a live call. Response caching belongs at the origin, not in a per-tenant KV namespace, so the template does not carry one. Avoid duplicate reads by shape instead: load in the highest route that needs the data and pass it down via `parentMatchPromise`.

## Metadata

`src/lib/seo.ts` builds the meta tags. Return `meta` from a route's `head()`:

```tsx
head: ({ loaderData }) => ({
  meta: seo({ title, description, path: "/blog", type: "article" }),
  scripts: [jsonLd({ "@context": "https://schema.org", "@type": "BlogPosting" })],
}),
```

`head()` runs on the server AND in the browser, so it must not read env directly — use `getAppUrl()` from `src/lib/site-url.ts`, which resolves both ways.

The site-wide social card is rendered by `src/routes/api/og.tsx` (Satori via `workers-og`). Pass `image` to `seo()` to override it for one route.

Routes declare their own sitemap policy in `staticData` — `{ sitemap: false }` for a page that must not be indexed, `{ sitemap: { priority } }` to weight one. Layout routes are detected automatically and never listed. `src/routes/_marketing.tsx` sets a default title/description for the whole storefront, so a route that forgets `head()` still gets sane metadata; anything it does set wins (the router keeps the deepest title and dedupes by name/property). `breadcrumbJsonLd(crumbs)` and `jsonLd(data)` cover structured data; `formatDate` / `formatPrice` in `src/lib/format-price.ts` keep formatting consistent.

## Images

**Every image needs an explicit `width` and `height`** — the displayed size, not the source's. Crevio's edge resizes from those attributes as it serves the page; without them the original ships whole (measured: 2.9MB into a 900px slot). Use a plain `<img>`; there is no image component.

## Cloudflare Workers runtime

This ships as a **Cloudflare Worker**, not Node. Module top-level runs once at worker **startup**, with no request in scope — so **env bindings (`process.env.*`, secrets) and anything derived from them are unavailable there**; they only exist inside request handlers. Any env read, `fetch`, `new URL(env)`, client/config construction, or throwing side effect at module scope crashes the worker at startup. Do that work per-request instead — in loaders, `head()`, server functions, server route handlers — never in a module-level const.

It's invisible until deploy: it passes `build` and `wrangler --dry-run` (neither runs the worker) and only fails with an opaque CF `500 (code 10002)`. **Before deploying, run `bun run build && bun run preflight`.** Booting is not enough and neither is `wrangler deploy --dry-run`: route modules are code-split and evaluated lazily, so a module-scope throw surfaces on the FIRST REQUEST, not at startup. Measured — such a throw passes `tsc`, `vite build`, `wrangler --dry-run` and a boot-only check while every request 500s.

`preflight` runs `test/smoke.test.ts`, which serves real requests through the built worker using Wrangler's own `createTestHarness()`. It runs on `node --test`, not `bun test` — the harness crashes workerd under Bun.

## Debugging locally (Local Explorer)

The dev server serves the Local Explorer UI at `/cdn-cgi/explorer` and its API at
`/cdn-cgi/explorer/api` — zero config via the Cloudflare Vite plugin. `GET` the API root
for its OpenAPI spec, then query traces and logs (`POST /local/observability/query` —
read-only SQL over `spans`/`logs`, a span per request, `fetch()` and binding call) or
read and seed R2 / D1. Use it before adding `console.log` or redeploying: a failing
SDK call or slow route shows up as the exact span with its error and timing.

Read the startup banner for the port (3000 is often taken); it prints the
`/cdn-cgi/local/explorer/api` alias — both forms work. It can't catch the module-scope
startup crash above — that still needs `bun run build && bun run preflight`.

## Feature modules

`src/config/features.ts` is the master switch for built-in capabilities — `auth` (sign-in + `/dashboard` members area), `bookings` (`<CrevioBooking>` scheduler), `blog`, `forms` (contact/newsletter), `legal`. Enable/disable each to fit the use case — don't ship every module. A coach selling calls wants `bookings`; a newsletter/creator wants `forms` + `blog`; a course seller wants `auth`. Flipping a flag off drops its routes, nav, and sitemap entries automatically; flipping on requires wiring real ids (`form_…`, `etype_…`).

Gate a module by spreading `featureRoute(key)` into its **layout route** — see `src/routes/_marketing/blog.tsx`:

```tsx
export const Route = createFileRoute("/_marketing/blog")({
  ...featureRoute("blog"),
  component: Outlet,
})
```

That is the only place the key is written. It supplies the `beforeLoad` gate (which halts the match chain — a `loader` would not) and the `staticData.feature` the sitemap reads, and the file router forces every `/blog` route to nest under it, so a new blog page can ship neither ungated nor wrongly listed. Composing it with another `beforeLoad` (as `_gated.tsx` does for auth) means calling `featureRoute(key).beforeLoad()` inside yours — a bare spread would be overwritten.

## Auth & gating

`src/lib/session.ts` exposes server functions, not helpers to import into components:

- `hasSession()` — is anyone signed in; identity only, no profile fetch
- `loadViewer()` — the signed-in visitor's profile, or null
- `requireViewer({ data: { returnTo } })` — same, but redirects to `/login`
- `loadAccess({ data: { resourceId } })` — entitlement, read fresh; omit `resourceId` for the visitor's own account
- `requireAccess({ data: { resourceId, minimum, upgradeUrl } })` — redirects when short

Gate a whole subtree once in the layout route's **`beforeLoad`** (see `src/routes/_gated.tsx`), never per page, and never in a `loader`. Put any new signed-in-only page under `_gated/` and it inherits the gate and the members shell by where it sits.

🚨 `beforeLoad` runs parent→child and halts the chain on a thrown redirect; **loaders all run together under `Promise.all`**, so a gate in a `loader` does not stop the child loaders it looks like it guards — they fire for logged-out visitors too. Return the viewer from `beforeLoad` and the loader reads it off `context`.

`<AccessGate>` gates a *section* on an already-loaded level — it hides markup, nothing more. Never put restricted data (a paid video URL, a download link) in a loader and rely on `<AccessGate>` to hide it: the loader payload ships in the SSR HTML regardless. Gate the *load*, not just the render.

## Crevio API, SDK & components

See the `crevio-api` skill — it fetches the canonical hosted manifest at `https://api.crevio.co/skill.md`, the single source of truth for the Crevio API, SDK, and Forms.

`formId` and `eventTypeId` are typed `` `form_${string}` `` / `` `etype_${string}` `` (`src/lib/crevio-ids.ts`), so an empty or wrong-prefix id fails to compile wherever it comes from — including a ternary, an imported constant, or a prop passed through a wrapper, none of which a static scan can see.

Crevio components render a "not available" fallback unless wired to a record you create FIRST via the `crevio_api` MCP — `<CrevioForm formId>` from `POST /v1/forms` (`form_…`), `<CrevioBooking eventTypeId>` from `POST /v1/event-types` (`etype_…`). Bind the `form_…`/`etype_…` id it returns. A wrong or empty id fails `tsc`, so `bun run build` stops before it can ship the fallback.

Both fetch their record from the browser (via `<CrevioEmbed>`, which owns the skeleton and the "not available" fallback for both) so they stay droppable into any page without that page's loader knowing about them. A route that ALWAYS shows one should load the record in its own `loader` and render `<FormFields>` / `<BookingWidget>` directly instead — that server-renders.

## Skills

Skills live in `.agents/skills/` — load the relevant `SKILL.md` before working in its area.

- `crevio-api` — Crevio API/SDK, `src/lib/data.ts`, `<CrevioForm>` / `<CrevioBooking>`
- `frontend-design` — building UI components and pages
- `og-image-design` — the `/api/og` social card, Satori limits, platform specs
- `cloudflare` / `wrangler` / `workers-best-practices` — Workers, D1/KV/R2, deploys
- `seo-audit` / `seo-content-writer` — search and content passes
