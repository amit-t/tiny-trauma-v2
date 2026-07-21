# DEPLOY.md — static export

The site is a **static export**. `next build` writes a complete site to `out/`,
and `out/` is what gets published. There is no application server, no database,
no cron and no secrets in production.

This replaces the earlier DigitalOcean App Platform + Managed Postgres + Resend
deployment, which was retired along with the newsletter backend and the admin
dashboard.

## What is actually deployed

| | |
| --- | --- |
| Artifact | the `out/` directory |
| Host | here.now (static file hosting) |
| Trigger | push to `main` |
| Build | `pnpm install --frozen-lockfile` then `pnpm build` |
| Runtime | none — every page is rendered at build time |

Operational details of the here.now setup — site slug, custom domain binding,
DNS and CI credentials — are recorded separately in
`docs/migration-to-here-now.md`, which the migration tooling owns. Do not
duplicate them here; they will drift.

## Build it yourself

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm preview      # serves out/ on http://localhost:3000
```

`pnpm start` is gone. `next start` boots a Node server, which a static export
does not use. Any file server works — `python3 -m http.server`, `npx serve`,
nginx, or the host itself.

## Before you publish

Worth checking, because a static site fails silently rather than erroring:

1. `out/index.html` exists and is not empty.
2. Every route has an `index.html`: `find out -name index.html | wc -l`.
3. No secrets got baked in — everything in `out/` is public:
   `grep -rIl -E 'postgres://|_SECRET|_API_KEY|-----BEGIN' out`
4. Click through the served copy. A blank page still exits 0.

## Environment

The build reads one optional variable, `PLAUSIBLE_DOMAIN`. It is inlined into
the HTML at build time, so it is public by definition. There is nothing else,
and nothing secret — see [`.env.local.example`](../.env.local.example).

The retired stack used `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`, `RESEND_WEBHOOK_SECRET`,
`CRON_SECRET` and `OWNER_EMAIL`. None of them have a consumer any more. If they
are still set anywhere — a host's env panel, a CI secret store, a local
`.env.local` — they can be revoked and deleted.

## Publishing a post

1. Add `content/musings/<slug>.mdx` or `content/shorts/<slug>.mdx`.
2. Set `status: published` in the frontmatter. Drafts build locally and are
   excluded from production, the sitemap and the feed.
3. Commit and push to `main`. The site rebuilds and republishes.

There is no admin UI and no publish button. The MDX in git is the source of
truth.

Note: each of `content/musings/` and `content/shorts/` must hold at least one
post. Both `[slug]` routes set `dynamicParams = false`, and a static export
refuses to build a dynamic route that generates zero pages.

## The newsletter

The list lives on Substack. The site links to it and does nothing else — no
form, no endpoint, no subscriber storage. The URL is `NEWSLETTER_URL` in
[`lib/site.ts`](../lib/site.ts).

Sending is done from Substack, not from this repo. The old flow — campaign rows
in Postgres, a GitHub Actions cron hitting `/api/cron/send-campaigns`, delivery
through Resend, open and bounce tracking via a Resend webhook — no longer
exists in any form.

## Smoke test after publishing

1. The apex serves the homepage — hero, fonts and theme toggle all work.
   Confirm you are looking at the site, not a host placeholder page.
2. `/musings/` and `/shorts/` list posts; open one of each and read the prose.
3. `/feed.xml`, `/sitemap.xml` and `/robots.txt` all return their content, and
   the URLs inside them point at the live domain.
4. The subscribe links land on Substack.
5. Add a test essay locally, push to `main`, and confirm it appears.

## Rolling back

The published artifact is a directory of files. To roll back, check out the
previous commit, rebuild, and republish:

```bash
git checkout <previous-sha>
pnpm install --frozen-lockfile && pnpm build
```

There is no database to migrate back and no server state to reconcile.
