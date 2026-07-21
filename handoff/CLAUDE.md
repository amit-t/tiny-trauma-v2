# CLAUDE.md — Tiny Trauma v2

Rules for the Claude Code agent working in this repo. Read this before every session.

## Who you're building for

One person. The owner of the blog, who is also the only writer. There is no
team, no editor, no moderator, and no admin interface. Optimise every flow for one tired person at 11pm
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
  - Subscribe CTA: *"subscribe on substack →"* (a link — there is no form)
  - AI generating: *"thinking…"* (italic, accent color, slow pulse) — not "Loading..."

## Design

`design/styles-v3.css` contains the final tokens. `design/*.html` files are visual
ground truth. The Next.js app MUST match these pixel-for-pixel on the public
pages. Don't introduce a second design language anywhere.

When in doubt about a component, open the matching HTML file and copy the styles.
The design has already been reviewed and approved.

## Code conventions

- **TypeScript strict mode.** `any` requires a comment explaining why.
- **No `useEffect` for data fetching.** Use React Server Components by default;
  reach for client components only when there's interactivity that needs it.
- **No server code at all.** The site is a static export (`output: "export"`).
  Server actions, middleware, request-reading route handlers and dynamic
  rendering are unavailable — the build fails if you add one. Route handlers
  are allowed only as `GET` + `dynamic = "force-static"`, which is how
  `feed.xml` works.
- **No database.** Content comes from MDX in `content/`, read through
  `lib/posts.ts`. Anything that needs storage belongs to a third party the
  site links out to, not to this repo.
- **Site-wide constants live in `lib/site.ts`** — canonical URL, contact
  address, Substack URL. Do not inline them in components.
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
  The site is static content; AI lives in the local Claude Code skill.
- No drop shadows (one exception: modals).
- No emoji in product UI.
- No "we" voice anywhere — it's a personal blog, "I" only.
- No third typeface. Fraunces + IBM Plex Mono + Caveat.
- No icon libraries for nav or CTAs. Type does the work.
- No multi-tenant patterns. No "organizations", no roles, no permissions matrices.
- No fake content. Use the real MDX files in `content/` so the visuals stay
  honest.
- No `prefers-color-scheme` defaults. Dark is canonical. Light is opt-in via toggle.
- No in-app post editor / tiptap / autosave / revisions, and no admin UI at
  all — writing happens in the local skill and ships as a git commit.

## Secrets

**There are none, and there is nowhere to put one.** The site is a static
export: everything the build can read is inlined into public HTML, and there
is no server to hold a key at runtime.

`.env.local.example` at the repo root lists the single optional variable:

```
PLAUSIBLE_DOMAIN=               # e.g. tinytrauma.com; empty omits the script
```

If you find yourself wanting a secret, the feature needs a server, and this
site does not have one. Say so instead of adding it.

**There is no `ANTHROPIC_API_KEY`.** This app does not call Anthropic from
the server. All AI happens locally in the `tiny-trauma-content` Claude Code
skill, which uses the owner's Claude Code subscription. Do not introduce
Anthropic SDK to the deployed app.

## When stuck

Open `handoff/ARCHITECTURE.md` for the data model and flows. Open the matching
`design/*.html` file for the visual answer. Otherwise, ask the user — don't
guess at product decisions.
