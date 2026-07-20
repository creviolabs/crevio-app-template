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

## Cloudflare Workers runtime

This ships as a **Cloudflare Worker**, not Node. Module top-level runs once at worker **startup**, with no request in scope — so **env bindings (`process.env.*`, secrets) and anything derived from them are unavailable there**; they only exist inside request handlers. Any env read, `fetch`, `new URL(env)`, client/config construction, or throwing side effect at module scope crashes the worker at startup. Do that work per-request instead — in route handlers, `generateMetadata()`, loaders — never in a module-level const.

It's invisible until deploy: it passes `build` and `wrangler --dry-run` (neither runs the worker) and only fails with an opaque CF `500 (code 10002)`. **Before deploying, run `bun run build && bun run preflight`** — it boots the worker in workerd and catches any startup failure locally (`dev`/`start` use Vite/Node and won't).

## Feature modules

`config/features.ts` is the master switch for built-in capabilities — `auth` (sign-in + `/dashboard` members area), `bookings` (`<CrevioBooking>` scheduler), `blog`, `forms` (contact/newsletter), `legal`. Enable/disable each to fit the use case — don't ship every module. A coach selling calls wants `bookings`; a newsletter/creator wants `forms` + `blog`; a course seller wants `auth`. Flipping a flag off drops its routes, nav, and sitemap entries automatically; flipping on requires wiring real ids (`form_…`, `etype_…`).

## Crevio API, SDK & Forms

See the `crevio-api` skill — it fetches the canonical hosted manifest at `https://api.crevio.co/skill.md`, the single source of truth for the Crevio API, SDK, and Forms.

Every `<CrevioForm>` must be bound to a real Form: create it first (`POST /v1/forms` via the `crevio_api` MCP), then use the returned prefix_id (`form_...`) as `formId`. The build fails on an empty or non-`form_` static `formId` (`scripts/check-form-ids.ts`) — bind a real Form or remove the usage.

## Skills

Skills live in `.claude/skills/` — load the relevant `SKILL.md` before working in its area.

- `crevio-api` — Crevio API/SDK, `lib/data.ts`, `<CrevioForm>`
- `frontend-design` — building UI components and pages
- `vercel-react-best-practices` — React 19 + Next.js performance
- `cloudflare` / `wrangler` / `workers-best-practices` — Workers, D1/KV/R2, deploys
