# AGENTS.md

Guidance for AI agents working in this repo. Overrides any parent `AGENTS.md` (e.g. `crevio-app/AGENTS.md`) — this is a Next.js 15 project, not Rails.

## Commands

```bash
bun run dev          # vinext dev server
bun run typecheck    # wrangler types + tsc
bun run check        # biome check --write --unsafe . (auto-fixes lint + format)
bun run build        # runs typecheck, then production build
bun run preflight     # boot the built worker in workerd (run after build, before deploy)
```

## Git

Never run interactive git commands — sandbox shells have no TTY and `$GIT_EDITOR` is unset. They will fail with `Standard input is not a terminal`.

Forbidden:
- `git rebase -i`
- `git add -i` / `git add -p`
- `git commit` without `-m` / `-F`

For rewriting history non-interactively, use `GIT_SEQUENCE_EDITOR=:` and `GIT_EDITOR=:` to no-op the editor, or prefer `git reset --soft` + fresh commits.

## Stack

- Next.js 15 (via `vinext`) deployed to Cloudflare Workers
- React 19 + TypeScript
- Shadcn/UI (in `components/ui/`) — biome lint disabled there, do not edit
- TailwindCSS 4 with theme via CSS variables (oklch) in `app/app.css`
- Data layer via `@crevio/sdk` in `lib/data.ts`

## Images

**Every image needs an explicit `width` and `height`** — the displayed size, not the source's. Crevio's edge resizes from those attributes as it serves the page; without them the original ships whole (measured: 2.9MB into a 900px slot). `next/image` and plain `<img>` both work.

## Cloudflare Workers runtime

This ships as a **Cloudflare Worker**, not Node. Module top-level runs once at worker **startup**, with no request in scope — so **env bindings (`process.env.*`, secrets) and anything derived from them are unavailable there**; they only exist inside request handlers. Any env read, `fetch`, `new URL(env)`, client/config construction, or throwing side effect at module scope crashes the worker at startup. Do that work per-request instead — in route handlers, `generateMetadata()`, loaders — never in a module-level const.

It's invisible until deploy: it passes `build` and `wrangler --dry-run` (neither runs the worker) and only fails with an opaque CF `500 (code 10002)`. **Before deploying, run `bun run build && bun run preflight`** — it boots the worker in workerd and catches any startup failure locally (`dev`/`start` use Vite/Node and won't).

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

`config/features.ts` is the master switch for built-in capabilities — `auth` (sign-in + `/dashboard` members area), `bookings` (`<CrevioBooking>` scheduler), `blog`, `forms` (contact/newsletter), `legal`. Enable/disable each to fit the use case — don't ship every module. A coach selling calls wants `bookings`; a newsletter/creator wants `forms` + `blog`; a course seller wants `auth`. Flipping a flag off drops its routes, nav, and sitemap entries automatically; flipping on requires wiring real ids (`form_…`, `etype_…`).

## Crevio API, SDK & components

See the `crevio-api` skill — it fetches the canonical hosted manifest at `https://api.crevio.co/skill.md`, the single source of truth for the Crevio API, SDK, and Forms.

Crevio components render a "not available" fallback unless wired to a record you create FIRST via the `crevio_api` MCP — `<CrevioForm formId>` from `POST /v1/forms` (`form_…`), `<CrevioBooking eventTypeId>` from `POST /v1/event-types` (`etype_…`). Bind the `form_…`/`etype_…` id it returns. `bun run check:wiring` fails the build on an unwired one a route renders; an orphan nothing imports only warns, so delete it rather than switching the whole feature off.

## Skills

Skills live in `.claude/skills/` — load the relevant `SKILL.md` before working in its area.

- `crevio-api` — Crevio API/SDK, `lib/data.ts`, `<CrevioForm>` / `<CrevioBooking>`
- `frontend-design` — building UI components and pages
- `vercel-react-best-practices` — React 19 + Next.js performance
- `cloudflare` / `wrangler` / `workers-best-practices` — Workers, D1/KV/R2, deploys
