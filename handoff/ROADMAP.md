# ROADMAP.md — six phases

Each phase is a Claude Code session. Stop after each, verify, then move on.
Don't combine phases.

## Phase 0 · Bootstrap (≈30 min)

Empty repo → runnable Next.js 15 + TS + Tailwind v4 + Drizzle + Better Auth +
Resend SDK installed. Local Postgres via Docker (`docker-compose.yml`).
A "hello tiny trauma" page in Fraunces on warm dark. Standalone build output
configured for DO deploy.

**Deliverable**: `pnpm db:up && pnpm dev` renders a single Fraunces "hello"
page, no errors.

→ `prompts/phase-0-bootstrap.md`

## Phase 1 · Design system (≈45 min)

Port `design/styles-v3.css` tokens to `app/globals.css` under Tailwind v4
`@theme`. Build primitives: Button, Input, Chip, Cover, Marginalia,
PullQuote, HandwrittenAside, ArtSlot, ThemeToggle, Wordmark. A `/design`
route shows everything in dark + light. Pixel-match `design/*.html`.

**Deliverable**: `/design` route shows every primitive, theme toggle works,
matches the HTML reference.

→ `prompts/phase-1-design-system.md`

## Phase 2 · Public site (MDX content) (≈2.5 h)

Build every public page. Content comes from MDX files in `/content/`. Set up
the MDX pipeline: `@next/mdx` + Velite (or a small loader) + custom remark
plugins for `==handwritten==`, `>>> pullquote`, `[[aside]]` syntax.

Seed `/content/musings/` and `/content/shorts/` with 3–4 of the essays
referenced in `design/musings.html` and shorts in `design/shorts.html`.
Wire navigation, build `/feed.xml`, `/sitemap.xml`, `/robots.txt`, 404, error.

**Deliverable**: Browse every public page on localhost; visually matches
`design/*.html` exactly; lighthouse perf ≥ 95.

→ `prompts/phase-2-public-site.md`

## Phase 3 · Auth + admin shell (≈60 min)

Better Auth magic-link sign-in via Resend. Single owner from `OWNER_EMAIL`.
Admin shell with top bar + sidebar. Stub pages: Posts (read-only MDX viewer),
Subscribers, Campaigns, Settings. Voice in every empty state.

**Deliverable**: Sign in with magic link, land on `/admin`, owner check works.

→ `prompts/phase-3-auth-admin-shell.md`

## Phase 4 · MDX content pipeline + admin posts viewer (≈90 min)

Tighten the MDX pipeline from phase 2 — Zod validation of frontmatter, typed
generated manifest, dev-mode hot reload. Build `/admin/posts`: read-only list
of all MDX files with their frontmatter, draft/published status, and an
"open in editor" link (`vscode://file/<abs path>`). This is a window into
`/content/`, not an editor.

**Deliverable**: New essays added to `/content/musings/` appear on
`/musings` automatically. `/admin/posts` shows the full list with file paths.

→ `prompts/phase-4-mdx-content.md`

## Phase 5 · Newsletter (≈2 h)

Subscribers DB, double-opt-in flow, admin subscribers table with CSV export.
Campaigns: create from a published MDX file, edit subject/preheader/personal
note, react-email preview, send test, schedule, cron sends.

**Deliverable**: Subscribe → confirm → welcome. Create campaign from a post,
schedule, cron fires, email arrives, unsubscribe works.

→ `prompts/phase-5-newsletter.md`

## Phase 6 · Polish + deploy (≈90 min)

Pass through every admin route for empty/error/loading states. Microcopy
review. Set up DigitalOcean App Platform + Managed Postgres, point
`tiny trauma.in` DNS, verify Resend domain, wire GitHub Actions cron.

**Deliverable**: Production deploy live at `tinytrauma.in`. First essay
visible. Newsletter test sent end-to-end.

→ `prompts/phase-6-polish-deploy.md`

---

## After phase 6

Install the `tiny-trauma-content` Claude Code skill (see
`handoff/skills/tiny-trauma-content/`). First real essay starts there:
brainstorm → MDX → commit → push → live.

The skill ships as a v0 starting point. You and Claude refine it together in
a grill-me session once the website is up and you've written one or two
essays through it and noticed what needs to change.

## Phase budget summary

| Phase | Time   | Why                                       |
|-------|--------|-------------------------------------------|
| 0     | 30m    | Foundation + local docker postgres        |
| 1     | 45m    | Design tokens + primitives                 |
| 2     | 2.5h   | Public site + MDX pipeline                |
| 3     | 60m    | Auth + admin shell                        |
| 4     | 90m    | MDX validator + admin posts viewer        |
| 5     | 2h     | Newsletter (full flow)                    |
| 6     | 90m    | Polish + DigitalOcean deploy              |
| **Total** | **≈9.5h** | One long Saturday, or three evenings  |
