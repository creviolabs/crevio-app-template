# AGENTS.md

Guidance for AI agents working in this repo. Overrides any parent `AGENTS.md` (e.g. `crevio-app/AGENTS.md`) — this is a Next.js 15 project, not Rails.

## Commands

```bash
bun run dev          # vinext dev server
bun run build        # production build
bun run typecheck    # wrangler types + tsgo -b
bun run check        # biome check --write --unsafe . (auto-fixes lint + format)
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

## Forms

Use `<CrevioForm formId="..." />` (from `components/forms/crevio-form.tsx`) to render any Form anywhere — pass the `id` returned when you provisioned the Form.

All Form lifecycle work — create, update, archive, restore, delete, and checking that an id still resolves on rebuild — goes through the `crevio_api` MCP. Read its tool descriptions for request/response shapes. The SDK in `lib/crevio-client.ts` is for runtime rendering only; don't reach for it when managing Forms.

The page source is the source of truth for which Form belongs to a page — no registry, no env var.
