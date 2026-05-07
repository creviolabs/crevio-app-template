# AGENTS.md

Guidance for AI agents working in this repo. Overrides any parent `AGENTS.md` (e.g. `crevio-app/AGENTS.md`) — this is a Next.js 15 project, not Rails.

## Commands

```bash
bun run dev          # vinext dev server
bun run build        # production build
bun run typecheck    # wrangler types + tsgo -b
bun run lint         # biome lint .
bun run check        # biome check . (lint + format)
bun run format       # biome format --write .
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

Three components ship under `components/forms/`:

- `newsletter-form.tsx` — flagship single-email inline signup, drop anywhere. Posts via `crevio.subscribers.create()` to the primary newsletter Form (auto-provisioned).
- `contact-form.tsx` — flagship multi-field message form, page section. Posts via `crevio.formSubmissions.create()` to the primary contact Form (auto-provisioned).
- `dynamic-form.tsx` — schema-driven generic renderer. Takes `formId` (or `purpose` to resolve a primary). Renders every field type, honors `confirmationRequired`. Use this for anything beyond newsletter and contact.

### New kinds of forms (waitlists, surveys, RSVPs)

Provision Forms via the `crevio_api` MCP (`POST /v1/forms`) — Forms are account-level config, not per-request data. Read the MCP's tool schema for the request shape, valid `purpose` values, and field types.

Then **drop `<DynamicForm formId="form_xxx" />`** wherever it belongs. Only mirror `contact-form.tsx` when you need bespoke layout/copy/success state that the dynamic renderer can't express.
