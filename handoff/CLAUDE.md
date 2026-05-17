# CLAUDE.md — Tiny Trauma v2

Rules for the Claude Code agent working in this repo. Read this before every session.

## Who you're building for

One person. The owner of the blog. The admin user IS the writer. There is no
team, no editor, no moderator. Optimise every flow for one tired person at 11pm
on a Sunday wanting to ship one essay.

## Voice (the product has one — match it in code, copy, errors, comments)

- **Tone**: dry, slightly literary, self-aware, never preachy. Examples in
  `design/index.html` lede, footer "currently" block, About page prose.
- **Casing**: sentence case everywhere. Mono fixtures are gone — do NOT use uppercase
  for metadata, labels, nav, anything. (This was an explicit rejection in design.)
- **Italics carry emphasis.** Never bold inside prose. Bold reserved for UI affordance.
- **The handwritten font (Caveat) is sacred.** Use it ≤2 times per page. The hero
  inline phrase "the small daily friction" and the footer "if you found something
  here, tell someone" — those are the canonical uses. Don't sprinkle it as decoration.
- **Microcopy examples** that pass the smell test:
  - Empty drafts: *"no drafts. probably for the best."*
  - 404: *"this page does not exist, and probably never did."*
  - Subscribe success: *"you're on the list. I'll be in touch on sunday."*
  - Form error: *"that doesn't look like a full email address yet."*
  - AI generating: *"thinking…"* (italic, accent color, slow pulse) — not "Loading..."

## Design

`design/styles-v3.css` contains the final tokens. `design/*.html` files are visual
ground truth. The Next.js app MUST match these pixel-for-pixel on the public
pages. The admin extends the same system; don't introduce a second design language.

When in doubt about a component, open the matching HTML file and copy the styles.
The design has already been reviewed and approved.

## Code conventions

- **TypeScript strict mode.** `any` requires a comment explaining why.
- **No `useEffect` for data fetching.** Use React Server Components by default;
  reach for client components only when there's interactivity that needs it.
- **Server actions for mutations** — no API routes unless there's a third party
  calling them (webhooks, RSS, etc.).
- **Drizzle, not Prisma.** Schema in `db/schema.ts`. Migrations via `drizzle-kit`.
- **Tailwind v4 CSS-first config**. Put tokens in `app/globals.css` under
  `@theme { ... }`. Component styles via class-variance-authority where it makes sense.
- **shadcn-style components** in `components/ui/`. Generate them with the CLI, then
  restyle to match the design system. Do not pull in shadcn defaults wholesale.
- **No CSS-in-JS libraries.** Tailwind + globals.css only.
- **next/font** for Newsreader, IBM Plex Mono, Caveat. Pre-loaded, no FOUT.
- **Filenames**: `kebab-case` for routes/files, `PascalCase` for components,
  `camelCase` for functions.
- **Imports**: absolute imports via `@/` alias.

## Testing

- Vitest for unit tests of utility functions (date formatting, slugging, etc.).
- No e2e for v1 — visual review by the owner is the acceptance criteria.
- AI prompt outputs are tested by running them, not by snapshots.

## Working method

- **Work one phase at a time.** Each phase has a prompt in `handoff/prompts/`.
  Read the prompt fully before starting. Do not run ahead.
- **Stop at phase boundaries.** When a phase's acceptance criteria are met, stop
  and ask the user to verify before starting the next phase.
- **Commit often.** One commit per logical unit of work, conventional commits
  format (`feat:`, `fix:`, `chore:`, `docs:`).
- **PR per phase.** Push branch `phase-N-name`, open PR, let the user review,
  merge to main, then move on.
- **Never bypass the design.** If a design HTML and the prompt conflict, ask.

## Forbidden

- No `ANTHROPIC_API_KEY` in the app, no Anthropic SDK, no server-side AI calls.
  The app is content + email; AI lives in the local Claude Code skill.
- No drop shadows (one exception: modals).
- No emoji in product UI.
- No "we" voice anywhere — it's a personal blog, "I" only.
- No third typeface. Fraunces + IBM Plex Mono + Caveat.
- No icon libraries for nav or CTAs. Type does the work.
- No multi-tenant patterns. No "organizations", no roles, no permissions matrices.
- No fake content during admin development. Use the seeded MDX files from
  `/content/` so the visuals stay honest.
- No `prefers-color-scheme` defaults. Dark is canonical. Light is opt-in via toggle.
- No in-app post editor / tiptap / autosave / revisions — writing happens in
  the local skill, the deployed admin only views MDX, never edits it.

## Secrets

`.env.local.example` lives at the repo root after phase 0. Fill it in via the
DigitalOcean App Platform dashboard in production, never commit `.env.local`.
Required:

```
DATABASE_URL=postgresql://tt:tt@localhost:5432/tinytrauma   # dev: docker compose
BETTER_AUTH_SECRET=...          # generate via `openssl rand -base64 32`
BETTER_AUTH_URL=http://localhost:3000
RESEND_API_KEY=...
RESEND_FROM=hi@tinytrauma.in    # verify domain in Resend first
RESEND_WEBHOOK_SECRET=...       # from Resend webhook config
OWNER_EMAIL=...                 # the email that gets owner access on signup
CRON_SECRET=...                 # `openssl rand -base64 32`; auth for cron POSTs
```

**There is no `ANTHROPIC_API_KEY`.** This app does not call Anthropic from
the server. All AI happens locally in the `tiny-trauma-content` Claude Code
skill, which uses the owner's Claude Code subscription. Do not introduce
Anthropic SDK to the deployed app.

## When stuck

Open `handoff/ARCHITECTURE.md` for the data model and flows. Open the matching
`design/*.html` file for the visual answer. Otherwise, ask the user — don't
guess at product decisions.
