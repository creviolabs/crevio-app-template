# AGENTS.md

Guidance for AI agents working in this repo. Overrides any parent `AGENTS.md` (e.g. `crevio-app/AGENTS.md`) — this is a Next.js 15 project, not Rails.

## Commands

```bash
bun run dev          # vinext dev server
bun run typecheck    # wrangler types + tsgo -b
bun run check        # biome check --write --unsafe . (auto-fixes lint + format)
bun run build        # production build
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

## Crevio API, SDK & Forms

See the `crevio-api` skill — it fetches the canonical hosted manifest at `https://api.crevio.co/skill.md`, the single source of truth for the Crevio API, SDK, and Forms.

Every `<CrevioForm>` must be bound to a real Form: create it first (`POST /v1/forms` via the `crevio_api` MCP), then use the returned prefix_id (`form_...`) as `formId`. The build fails on an empty or non-`form_` static `formId` (`scripts/check-form-ids.ts`) — bind a real Form or remove the usage.

## Skills

Skills live in `.claude/skills/` — load the relevant `SKILL.md` before working in its area.

- `crevio-api` — Crevio API/SDK, `lib/data.ts`, `<CrevioForm>`
- `frontend-design` — building UI components and pages
- `vercel-react-best-practices` — React 19 + Next.js performance
- `cloudflare` / `wrangler` / `workers-best-practices` — Workers, D1/KV/R2, deploys
