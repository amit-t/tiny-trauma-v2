# tiny trauma

A personal blog. Essays (`musings`) and very short fiction (`shorts`).

It is a **fully static site**: `next build` writes plain HTML, CSS and JS to
`out/`, and that directory is the whole site. There is no server, no database
and no runtime — every page is rendered at build time.

## How to run

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

No environment file is needed to run or build. The only variable the app reads
is `PLAUSIBLE_DOMAIN` (optional) — see [`.env.local.example`](./.env.local.example).

## How to build

```bash
pnpm build          # writes the static site to out/
pnpm preview        # serves out/ at http://localhost:3000
```

`pnpm start` does not exist. `next start` runs a Node server, which a static
export has no use for — serve `out/` with any file server instead.

## Writing

Posts are MDX files in `content/`:

```
content/musings/<slug>.mdx    essays
content/shorts/<slug>.mdx     short fiction
```

[Velite](https://velite.js.org) validates the frontmatter and compiles the
bodies into `.velite/` at build time; `lib/posts.ts` is the only module that
reads it. Frontmatter fields are documented in
[`handoff/CONTENT-MODEL.md`](./handoff/CONTENT-MODEL.md).

A post with `status: draft` is visible in `pnpm dev` and excluded from the
production build, the sitemap and the RSS feed.

Both `/musings/[slug]` and `/shorts/[slug]` set `dynamicParams = false`. A
static export cannot build a dynamic route that produces zero pages, so each
of the two directories must contain at least one post.

## Newsletter

The list lives on **Substack**. The site has no subscribe endpoint of its own —
every subscribe affordance is a plain link. The URL is `NEWSLETTER_URL` in
[`lib/site.ts`](./lib/site.ts), along with the canonical site URL and the
contact address. Change them there, not in components.

## Deployment

Published to **here.now** as a static site, on push to `main`. `out/` is the
published artifact; nothing else is uploaded and no build runs in production.

## Checks

```bash
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint
pnpm test           # vitest — MDX pipeline (remark plugins, schema)
pnpm test:visuals   # zsh suite for the bin/tt-visuals CLI
```

## Local tooling

`bin/tt-*` are local authoring CLIs (drafting, visuals, Instagram ingest) that
shell out to `claude` / `codex` / `gemini`. They are development tools and are
not part of the deployed site. See [`AGENTS.md`](./AGENTS.md).

Full project docs live in [`handoff/`](./handoff/).
