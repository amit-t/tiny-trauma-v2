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

## Why it's git-tracked but not deployed

The directory is in git so the catalog travels across machines and survives
laptop death. It is **not** in the deployed app because:

- Velite globs `content/**` only — never reads `inspirations/**`.
- Nothing in `app/`, `components/`, or `lib/` imports from `inspirations/`.
- Next bundles only what's imported, so the dir never enters the build
  output.

Result: the catalog ships to GitHub but not to DigitalOcean.

## How to use

1. Open Claude Code in the repo.
2. Edit `instagram/collections.json` — paste one or more Instagram
   saved-collection URLs.
3. Run the `tt-instagram-ingest` skill. It walks each collection in your
   logged-in browser via Claude-in-Chrome, dedups against the registry, and
   writes new posts into `instagram/posts/` with TT-flavored analysis.
4. Either browse the catalog manually (`rg`, `fzf`, your editor) or invoke
   the `tiny-trauma-content essay` flow — Step 2 surfaces the top 5
   highest-heat unused seeds automatically.

When a catalog post becomes a published essay, the `status` field on the
post flips to `shipped:<slug>` so the loop closes itself.
