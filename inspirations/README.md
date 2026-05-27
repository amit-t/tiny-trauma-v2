# inspirations/

Seed material for Tiny Trauma essays and shorts. Not source code, not
deployed.

## What lives here

- `instagram/collections.json` — list of Instagram saved-collection URLs
  the `tt-instagram-ingest` skill pulls from.
- `instagram/_url_registry.json` — dedup state. Tracks every post URL ever
  ingested so re-runs only fetch new ones.
- `instagram/posts/` — one `.mdx` file per ingested post, with TT-flavored
  frontmatter (`heat`, `tone_tags`, `status`, `seed_type`, etc.) and a body
  block per analysis field (Friction, Seed line, Voice, Essay angle, Short
  angle, Notable quote, Raw caption).
- `seeded-content/musings/` and `seeded-content/shorts/` — the original
  boilerplate MDX essays + shorts that shipped with the design phase.
  Moved out of `content/` so the deployed site launches empty and only
  contains posts you've actually written. Kept around as voice reference
  and as raw material you may want to revive or re-cast later — move a
  file back into `content/musings/` (or `content/shorts/`) when you want
  the site to publish it.

## Why it's git-tracked but not deployed

The directory is in git so the catalog travels across machines and survives
laptop death. It is **not** in the deployed app because:

- Velite globs `content/**` only — never reads `inspirations/**`.
- Nothing in `app/`, `components/`, or `lib/` imports from `inspirations/`.
- Next bundles only what's imported, so the dir never enters the build
  output.

Result: the catalog ships to GitHub but not to DigitalOcean.

## How to use

1. Open Claude Code in the repo. The Playwright MCP defined in `.mcp.json`
   auto-loads — see "First-time setup on a new machine" below if it doesn't.
2. Edit `instagram/collections.json` — paste one or more Instagram
   saved-collection URLs.
3. Run the `tt-instagram-ingest` skill (or `bin/tt-ingest`). It drives a
   headed Chromium tab via the Playwright MCP, walks each collection in
   your logged-in IG session, dedups against the registry, and writes new
   posts into `instagram/posts/` with TT-flavored analysis.
4. Either browse the catalog manually (`rg`, `fzf`, your editor) or invoke
   the `tiny-trauma-content essay` flow — Step 2 surfaces the top 5
   highest-heat unused seeds automatically.

When a catalog post becomes a published essay, the `status` field on the
post flips to `shipped:<slug>` so the loop closes itself.

## First-time setup on a new machine

The MCP and browser are project-local (no global installs), but they have
a per-machine bootstrap:

```sh
pnpm install              # installs @playwright/mcp + playwright
pnpm mcp:install-browsers # downloads Chromium into ~/Library/Caches/ms-playwright
```

Then restart Claude Code so it picks up `.mcp.json`. On the first ingest
run, a Chromium window opens — sign in to Instagram once. The session
cookies persist in the gitignored `.playwright-profile/` directory, so
subsequent runs on this machine are already logged in.

A different machine starts with an empty `.playwright-profile/` and needs
its own IG login the first time — there is no portable way to share
session cookies safely.
