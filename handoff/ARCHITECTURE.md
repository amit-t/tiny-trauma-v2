# ARCHITECTURE.md — Tiny Trauma v2

## Two pieces, clearly separated

```
┌──────────────────────────────────────────────────────────────────────┐
│  LOCAL ONLY — your laptop, inside Claude Code                        │
│                                                                      │
│   ┌─────────────────────────┐                                        │
│   │ tiny-trauma-content     │  brainstorms, drafts, edits            │
│   │ skill + bin/tt-* CLIs   │  (uses your Claude Code subscription)  │
│   └────────────┬────────────┘                                        │
│                │ outputs                                             │
│                ▼                                                     │
│   ┌─────────────────────────┐                                        │
│   │ content/musings/*.mdx   │  ← committed to git                    │
│   │ content/shorts/*.mdx    │    (the source of truth)               │
│   └────────────┬────────────┘                                        │
└────────────────┼─────────────────────────────────────────────────────┘
                 │ git push to main
                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BUILD — CI                                                          │
│                                                                      │
│   velite  →  validates frontmatter, compiles MDX bodies to HTML      │
│      │                                                               │
│      ▼                                                               │
│   next build (output: "export")                                      │
│      │                                                               │
│      ▼                                                               │
│   out/  —  every page rendered to HTML, once, here                   │
└────────────────┬─────────────────────────────────────────────────────┘
                 │ upload
                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│  DEPLOYED — here.now                                                 │
│                                                                      │
│   A directory of static files behind a CDN.                          │
│   No server. No database. No runtime. Nothing to break at 3 a.m.     │
└──────────────────────────────────────────────────────────────────────┘

           the newsletter lives entirely outside this diagram,
           on Substack. The site links to it; that is the whole
           integration.
```

**No API calls of any kind from the deployed site.** All AI is local, at
authoring time.

## Routes

Every route below is rendered to a file at build time. There are no dynamic
routes, no route handlers that read the request, no server actions and no
middleware — a static export supports none of them.

| Path                | Output                      | What                                                     |
|---------------------|-----------------------------|----------------------------------------------------------|
| `/`                 | `out/index.html`            | Home — hero, recent musings, featured short, subscribe band |
| `/musings/`         | `out/musings/index.html`    | All essays, year-grouped                                  |
| `/musings/<slug>/`  | one file per post           | Essay reading view                                        |
| `/shorts/`          | `out/shorts/index.html`     | All short fictions                                        |
| `/shorts/<slug>/`   | one file per post           | Short fiction reading view                                |
| `/about/`           | `out/about/index.html`      | About page                                                |
| `/newsletter/`      | `out/newsletter/index.html` | What the letter is, FAQ, recent essays, Substack link     |
| `/design/`          | `out/design/index.html`     | Design-system showcase (linked in the nav only in dev)    |
| `/feed.xml`         | `out/feed.xml`              | RSS — published posts only                                |
| `/sitemap.xml`      | `out/sitemap.xml`           | Sitemap — published posts only                            |
| `/robots.txt`       | `out/robots.txt`            | Robots                                                    |
| `/icon`, `/apple-icon` | PNG                      | Favicons, drawn with `next/og` at build time              |
| 404                 | `out/404.html`              | Not-found page                                            |

`trailingSlash: true`, so each page is `<route>/index.html` and any plain file
server resolves it without rewrite rules.

Both `[slug]` routes set `dynamicParams = false` and derive their paths from
`generateStaticParams()`. A static export cannot build a dynamic route that
generates zero pages, so `content/musings/` and `content/shorts/` must each
contain at least one post.

### Routes that no longer exist

Removed when the site went static. They required a server:

- `/api/subscribe`, `/api/unsubscribe`, `/api/webhooks/resend`,
  `/api/cron/send-campaigns`, `/api/auth/[...all]`
- `/admin`, `/admin/posts`, `/admin/campaigns`, `/admin/subscribers`,
  `/admin/settings`, `/admin/brainstorm`, `/admin/cross-post`
- `/sign-in`, `/sign-in/check-inbox`, `/not-owner`
- `/subscribe/confirm`, `/unsubscribed`

## Content model — MDX files

**Posts live in git**, at `content/musings/*.mdx` and `content/shorts/*.mdx`.
Full schema in [`CONTENT-MODEL.md`](./CONTENT-MODEL.md).

[Velite](https://velite.js.org) runs from `next.config.mjs` before Next
compiles, and at build time it:

1. Reads every `.mdx` file under `content/`
2. Validates frontmatter against a Zod schema (`lib/mdx/post-schema.ts`)
3. Runs the custom remark plugins — pull-quotes, asides, handwritten marks
4. Emits a typed manifest into `.velite/`, imported as `#site/content`
5. Hot-reloads in dev when files change

`lib/posts.ts` is the only module that reads that manifest. It sorts, filters
drafts, and exposes the small helpers the pages use.

Drafts (`status: draft`) render in `pnpm dev` and are excluded from the
production build, the sitemap and the feed.

## Data model

None. There is no database.

The retired stack ran Postgres via Drizzle with four tables — `users`,
`subscribers`, `campaigns` and `subscribe_events` — behind Better Auth and
Resend. All of it was deleted when the newsletter moved to Substack: the
schema, the migrations, the client, the mailer and the admin UI that drove it.

Substack owns the subscriber list now. This repo stores nothing about readers,
and has no way to.

## Configuration

`lib/site.ts` holds the values that change independently of markup: the
canonical URL, site name and description, the contact address, and the
Substack URL. Metadata, sitemap, robots and the RSS feed all read from it.

The build reads one optional environment variable, `PLAUSIBLE_DOMAIN`, inlined
at build time. There are no secrets — everything the build can see ends up in
public HTML.

## Key flows

### Publish an essay

1. Owner invokes the `tiny-trauma-content` skill in Claude Code locally.
2. The skill runs a grill-me session — theme, what they noticed this week,
   tone, length — then drafts in voice and edits with the user.
3. It writes `content/musings/<slug>.mdx` with full frontmatter.
4. Owner reviews the file and tweaks it.
5. `git commit && git push` to `main`.
6. CI rebuilds and republishes. The essay appears on `/musings/<slug>/`, in
   `/feed.xml` and in `/sitemap.xml`.

There is no publish button and no admin UI. The commit *is* the publish.

### Subscribe

The reader clicks a subscribe link and lands on Substack. That is the entire
flow. Nothing is stored here, no email is sent from here, and there is no
endpoint to POST to.

The old flow — double opt-in through `/api/subscribe`, a confirmation token,
a Resend email, a `pending → active` transition in Postgres — is gone.

### Send a letter

Done from Substack's own composer, outside this repo.

The old flow — snapshot a published MDX body into a campaign row, edit subject
and preheader in `/admin/campaigns`, schedule it, let a GitHub Actions cron hit
`/api/cron/send-campaigns` and batch through Resend, then record opens and
bounces via a Resend webhook — no longer exists.

## Cron jobs

None. Publishing is a `git push`, and sending is Substack's problem.

## Caching & revalidation

Nothing to revalidate. Every page is generated at build time and served as a
file; the only way content changes is a new build. `output: "export"` in
`next.config.mjs` is what makes that true.

## Environments

- **Local**: `pnpm dev`. No database, no Docker, no env file needed. MDX
  hot-reloads on save.
- **Production**: `out/`, published to here.now on push to `main`. See
  [`DEPLOY.md`](./DEPLOY.md).

## Out of scope

- Multi-author / teams / roles
- Comments (replies are by email, on purpose)
- Search (≤ 100 posts; the year-grouped list is enough)
- In-app AI (use the local skill instead)
- Direct social posting (the skill generates cross-post copy locally; you paste)
- Paid subscriptions
- Mobile app
- i18n

Anything needing a server is also out of scope by construction now — adding it
back means leaving the static export.
