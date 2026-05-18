# Manual tests — pending, by phase

The agent can verify code (typecheck, lint, unit tests, route smoke-tests),
but cannot click, eyeball, or send real email. This file tracks every check
the owner still has to run, organised by phase.

When you finish a check, tick the box. When a phase is fully verified, the
section can stay as a record.

---

## Phase 0 · Bootstrap

- [ ] Start Docker Desktop, then `pnpm db:up`. Confirm with `docker compose ps`
      that the `postgres` container is `Up (healthy)`.
- [ ] Open `http://localhost:3000` and confirm: - wordmark is Fraunces 800, italic coral "trauma", no trailing period - body is IBM Plex Mono (the standfirst paragraph) - background is warm dark `#14110C`

---

## Phase 1 · Design system

- [ ] Open `http://localhost:3000/design` in one tab and
      `handoff/design/index.html` in another. Eyeball: - chips (lavender / sage / butter / peach / slate) - cover-card colours (c-a … c-f) - pullquote with coral corner mark - wordmark (nav vs hero size) - hand-script asides (Caveat coral, rotated) - colophon spacing
- [ ] Click the theme toggle in the design page nav. Verify every primitive
      reads correctly in both dark and light. Reload — theme persists.

---

## Phase 2 · Public site

- [ ] Click through `/`, `/musings`, `/musings/why-i-cry-at-ads`,
      `/shorts`, `/shorts/the-3-am-cart`, `/about`, `/newsletter`.
      No 404s, no console errors.
- [ ] Side-by-side with `handoff/design/*.html` — confirm the spacing,
      hero, card grid, pullquote, drop cap, cover grid, FAQ all match.
- [ ] Lighthouse perf on `/` via `pnpm build && pnpm start` → expect ≥ 95.
      (Skipped in agent runs because the build/start loop is heavy.)

---

## Phase 3 · Auth + admin shell

Prereq: fill real values in `.env.local` (the dev placeholders that ship
with the agent will not send mail):

- `BETTER_AUTH_SECRET` — generate via `openssl rand -base64 32`
- `RESEND_API_KEY` — from your Resend dashboard
- `RESEND_FROM` — must be on a domain you've verified in Resend
- `OWNER_EMAIL` — the address that gets owner access

Then:

- [ ] `pnpm auth:init` (idempotent; creates `.data/auth.sqlite` if missing).
- [ ] `pnpm dev`. Visit `/sign-in`, submit the owner email. Expect
      `/sign-in/check-inbox?email=…` and a Resend email in your inbox.
- [ ] Click the link in the email → land on `/admin`, signed in.
- [ ] In a new browser/incognito, hit `/sign-in` and submit a non-owner
      email → redirect to `/not-owner` (no email sent).
- [ ] In the admin top bar, click each sidebar item (Dashboard, Posts,
      Brainstorm, Campaigns, Subscribers, Cross-post, Settings). The coral
      underline should follow the active route.
- [ ] Toggle the theme in the admin top bar — pages re-paint without
      hydration warnings.
- [ ] Click "sign out" → redirect back to `/sign-in`.

---

## Phase 4 · MDX content pipeline + admin posts viewer

- [ ] With `pnpm dev` running, add a new file
      `content/musings/test-round-trip.mdx` with valid frontmatter:
      ` ---
      title: "A test round trip"
      dek: "Confirming the MDX pipeline picks up new files on save."
      type: musing
      publishedAt: 2026-05-17
      number: 25
      tags: [small humiliations]
      status: published
  ***
  Just a few sentences. ==a small handwritten phrase== for good measure.
  `    Expect: the file appears at`/musings/test-round-trip`and on the
   `/musings` list within a second. Delete the file afterwards.
- [ ] In `/admin/posts`, click "open in editor ↗" on any row. VS Code (or
      Cursor / Windsurf) should open the matching `content/<type>/<slug>.mdx`.
- [ ] Edit the file body (add a paragraph), save, and watch the change
      hot-reload in the public detail page.
- [ ] Confirm the `draft-on-the-half-formed` essay appears on `/musings`
      with a small "draft" pill in dev, and is NOT in `/feed.xml` or
      `/sitemap.xml`.
- [ ] Force a bad-frontmatter build: temporarily set `number: -1` on any
      file, then `pnpm build`. Expect the build to fail with a Velite /
      Zod validation error. Revert the change.

---

## Phase 5 · Newsletter

Prereq:

- Real `RESEND_API_KEY`, `RESEND_FROM` (verified domain), `OWNER_EMAIL`
  in `.env.local`.
- Optional now, required for the webhook tests: `RESEND_WEBHOOK_SECRET`
  (Resend → Webhooks → create endpoint → copy signing secret). The
  webhook URL is `<site>/api/webhooks/resend`.
- `pnpm app:init` once — creates `.data/app.sqlite` with subscribers,
  campaigns, subscribe_events tables.

Subscribe + confirm + unsubscribe (end-to-end):

- [ ] From `/` (home newsletter band), submit your email. Form shows
      "↳ check your inbox. it's on the way."
- [ ] Confirm-subscription email arrives. Click the button.
- [ ] Land on `/subscribe/confirm` with three starter essays.
- [ ] Welcome email arrives within ~30s.
- [ ] In a separate tab, click the unsubscribe link in either email.
      Land on `/unsubscribed`. Confirm in `/admin/subscribers` that the
      row flipped to `unsubscribed`.
- [ ] Repeat the subscribe from `/about` (sidebar mini-form) and
      `/newsletter` (card + bottom mini-CTA). Each variant should reach
      the same flow.

Admin subscribers:

- [ ] `/admin/subscribers` shows the new rows.
- [ ] Filter pills work (status × tier).
- [ ] Search by email filters live.
- [ ] Row actions: `copy` copies the email; `unsubscribe` flips status;
      `delete` removes the row after confirm.
- [ ] `export CSV ↓` downloads
      `tiny-trauma-subscribers-YYYY-MM-DD.csv`.

Campaigns end-to-end:

- [ ] `/admin/campaigns/new` lists every published post. Pick one.
- [ ] You land on `/admin/campaigns/<id>` with subject + preheader +
      personal-note + body-snapshot prefilled.
- [ ] The right-side preview iframe shows the rendered email.
- [ ] Subscribe yourself (above) so there's at least one active
      recipient.
- [ ] Click `send test` with your email — test email arrives with
      `[test]` prefix in the subject.
- [ ] Set a schedule 2 minutes from now, save, click `schedule`. Status
      flips to `scheduled`.
- [ ] Wait 2 minutes, then click `send due now` on `/admin/campaigns`.
      Row flips to `sent` with `sent_count = 1`. Essay email arrives.
- [ ] Click the email open / a link in it, wait a minute, reload
      `/admin/campaigns` — `opens` / `clicks` increment (requires the
      Resend webhook to be configured + reachable).

Resend webhook:

- [ ] Resend dashboard → Webhooks → create endpoint pointing at
      `https://<your-site>/api/webhooks/resend`. Subscribe to all five
      events. Paste the signing secret into `RESEND_WEBHOOK_SECRET`.
- [ ] Send yourself a test campaign as above; check `subscribe_events`
      rows are written for delivered / opened / clicked.
- [ ] Subscribe an obviously-invalid address; after the bounce event,
      the subscriber row should flip to `bounced` automatically.

Cron in production (full automation lands in phase 6 / deploy):

- [ ] Until the GitHub Actions workflow is wired, run the cron locally
      via the `send due now` button on `/admin/campaigns`, or:
      `     curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
      https://<your-site>/api/cron/send-campaigns
    `

---

## Phase 6 · Polish + deploy

### Local Postgres bring-up (one-time)

The phase-6 cutover moved auth + app data from sqlite to Postgres via
Drizzle. To run the app locally now:

- [ ] Make sure Docker Desktop is running (the daemon was offline in
      earlier agent sessions).
- [ ] `pnpm db:up` — starts the postgres container from `docker-compose.yml`.
- [ ] `pnpm db:migrate` — applies `db/migrations/0000_*.sql` (creates
      `user`, `session`, `account`, `verification`, `subscribers`,
      `campaigns`, `subscribe_events` tables).
- [ ] (Optional) `pnpm db:studio` — Drizzle's web UI at
      `https://local.drizzle.studio/` for poking at rows.
- [ ] `pnpm dev` — should now boot without `.data/*.sqlite` files (the
      sqlite scaffolding has been removed). Re-run phase 3 + phase 5
      end-to-end checks against the new Postgres backend if you want
      parity confidence.

### Admin polish review (in voice)

Click through every admin route and confirm the copy reads in voice:

- [ ] `/admin` — workshop dashboard shows real numbers (drafts,
      scheduled, active subscribers, last sent). When everything is
      zero, the empty line reads as a Sunday-morning observation, not a
      "Welcome to your dashboard."
- [ ] `/admin/posts` — read-only window into `content/`. Empty filter
      states say _"no posts match this filter. probably for the best."_
- [ ] `/admin/brainstorm` and `/admin/cross-post` — both deliberately
      mark themselves _"later"_ and point at the local writing skill.
- [ ] `/admin/campaigns` — `new campaign →`, `send due now` (greys out
      when nothing is due), in-voice empty state.
- [ ] `/admin/campaigns/[id]` — `send now` confirm reads
      _"send to every active subscriber in this segment? it's going out
      the door."_; on success, status reads _"sent. now go for a walk."_
- [ ] `/admin/subscribers` — delete confirm reads
      _"delete <email>? not coming back."_

Throwing an exception in any admin route should hit `app/admin/error.tsx`
(_"something broke. it's me, not you."_ + `try again` button).

### Optional: Plausible

If you set `PLAUSIBLE_DOMAIN` in `.env.local` (or App Platform env), the
script appears in `<body>`. The "last 7 days" widget on the dashboard is
not implemented yet — when you want it, ask the agent to add it as a
small follow-up (the script ingestion is the only part that's wired).

### GitHub Actions cron

- [ ] Repo → Settings → Secrets and variables → Actions → add
      `CRON_SECRET` (matches the App Platform env var) and `SITE_URL`
      (e.g. `https://tinytrauma.in`).
- [ ] `.github/workflows/cron-send-campaigns.yml` is committed; verify
      via Actions tab → "cron-send-campaigns" → "Run workflow" → confirm
      the curl POST hits `/api/cron/send-campaigns` and returns
      `{"ok":true, …}`.

### DigitalOcean deploy

Follow `handoff/DEPLOY.md` end-to-end (1 through 7). Summary of the
owner-only steps:

- [ ] Create Managed Postgres cluster; create `tinytrauma` DB inside.
- [ ] Create App Platform app from GitHub repo (`main`, autodeploy on).
      Build = `pnpm install --frozen-lockfile && pnpm build`,
      Run = `node .next/standalone/server.js`, port 3000.
- [ ] Set every env var from `.env.local.example` in App Platform.
      Mark secrets as encrypted.
- [ ] Add `tinytrauma.in` as a domain in App Platform; add the matching
      A/CNAME records in your DNS. Let's Encrypt cert auto-issues.
- [ ] Add the App as a Trusted Source on the DB cluster; switch
      `DATABASE_URL` to the VPC private connection string.
- [ ] First-time migration: from your laptop, with the public DB URL +
      your IP whitelisted: `DATABASE_URL=… pnpm db:migrate`. Remove the
      whitelist after. Later deploys use a Pre-Deploy Job (see
      `DEPLOY.md` 2d-B).
- [ ] Resend domain: verify `tinytrauma.in` (DKIM, SPF, DMARC records in
      DNS). Set `RESEND_FROM=hi@tinytrauma.in`.
- [ ] Resend webhook: point at
      `https://tinytrauma.in/api/webhooks/resend`, subscribe to the five
      events, paste signing secret into App Platform env as
      `RESEND_WEBHOOK_SECRET`.

### Production smoke (after the deploy is up)

- [ ] `https://tinytrauma.in/` — hero, fonts, theme toggle.
- [ ] `/sign-in` → owner email → magic link → land on `/admin`.
- [ ] `/admin/posts` — every seeded MDX file appears.
- [ ] Subscribe a test email → confirm → check `/admin/subscribers`.
- [ ] Create a campaign from a published essay → send test to yourself.

### First real essay

- [ ] `tiny-trauma-content` skill is already installed at
      `.claude/skills/tiny-trauma-content/`. Open a Claude Code session
      in the repo and invoke it. Brainstorm → draft → accept the MDX →
      `git push`. DO rebuilds (~2 min). New essay live at
      `https://tinytrauma.in/musings/<slug>`.

---

## Writing posts · create, review, publish

The whole post lifecycle. Writing happens locally in the
`tiny-trauma-content` Claude Code skill. The deployed admin only views
MDX, never edits it.

### 1 · Create — grill-me draft to MDX

From the repo root, open Claude Code:

```bash
cd ~/Projects/AmitTiwari/tiny-trauma-v2
claude
```

Then pick a mode:

| Goal                          | Command                                                |
| ----------------------------- | ------------------------------------------------------ |
| Full essay → `.mdx`           | `/skill tiny-trauma-content essay`                     |
| Short fiction → `.mdx`        | `/skill tiny-trauma-content short`                     |
| Brainstorm only (no file)     | `/skill tiny-trauma-content brainstorm`                |
| Cross-post a published essay  | `/skill tiny-trauma-content cross-post musings/<slug>` |

The essay flow walks 10 steps: noticings → 3–5 angles → outline → draft
→ paragraph-by-paragraph edits → title → frontmatter → file.
One question at a time. Push back freely — it's the editor, not the
co-author. Full flow spec: `.claude/skills/tiny-trauma-content/prompts/essay.md`.

At the end it writes `content/musings/<slug>.mdx` (or
`content/shorts/<slug>.mdx`) and prints the exact `git add / commit / push`
commands. **Do not run them yet — review first.**

### 2 · Review — local preview before publish

The skill emits `status: published` by default. If you want to sit on it,
flip the frontmatter to `status: draft` before previewing — drafts are
excluded from public lists in prod but show up at the direct URL.

```bash
pnpm db:up        # only if pg isn't already running
pnpm dev
```

Then eyeball:

- [ ] `http://localhost:3000/musings/<slug>` (or `/shorts/<slug>`) —
      whole essay renders, hero tint matches the vibe, drop cap on
      paragraph one, no console errors.
- [ ] **Three custom marks render correctly:**
      `==handwritten==` → Caveat coral inline ·
      `>>> pullquote` → surface-tinted block with coral corner mark ·
      `[[aside]] line` → handwritten block, rotated.
- [ ] **Frontmatter sanity** — title sentence case with one italic word,
      `dek` ≤ 30 words, `number` = `max(existing) + 1` for the type,
      `tags` from the vocab in `frontmatter-spec.md`, `heroTint` is one
      of `lavender | sage | butter | peach | slate`.
- [ ] **Voice gut-check** — no emoji, no `**bold**` in body, no
      numbered lists, no "we", lowercase intentional. Read it aloud
      once. If a sentence stalls in your mouth, cut or rewrite it.
- [ ] Listing page (`/musings` or `/shorts`) shows the new card with
      the right tint and the new `number`. Featured only if `featured: true`.

If anything is off, edit the `.mdx` directly in your editor (or re-invoke
the skill and tell it what to change) and refresh.

### 3 · Complete — publish + email

Once the preview looks right:

```bash
git add content/musings/<slug>.mdx
git commit -m "essay: <title with italics stripped>"
git push
```

The push triggers a DigitalOcean rebuild (~2 min). Verify:

- [ ] `https://tinytrauma.in/musings/<slug>` returns 200 with the new essay.
- [ ] The listing page (`/musings` or `/shorts`) has the new card at the
      top (it sorts by `publishedAt` desc).

Then mail it to the list:

- [ ] Sign in at `https://tinytrauma.in/sign-in` (owner email → magic link).
- [ ] Go to **`/admin/campaigns/new`**, pick the new essay from the post
      picker, choose a **segment** (`weekly` / `monthly` / `both` / `all`),
      and click **Create campaign**.
- [ ] On the campaign editor: review the **subject** (pre-filled from
      `title`), **preheader** (pre-filled from `dek`), and add a
      **personal note** if you want one above the essay.
- [ ] **Send a test to yourself first** (button at the bottom). Open it
      in Gmail + a mobile client. Check links — public URL, unsubscribe,
      images. Send-test never logs an event, so use it freely.
- [ ] When the test looks right, either:
      **Send now** — confirm prompt: "send to every active subscriber in
      this segment? it's going out the door." · or
      **Schedule** — pick a future timestamp; the GitHub Actions cron
      (`*/15 * * * *`) picks it up and dispatches it.
- [ ] After send, the campaign row in `/admin/campaigns` flips to `sent`
      with `sentCount` filled in. Open/click counts arrive over the next
      hours/days via the Resend webhook.

### What goes where — at a glance

| Step             | Lives in                                        | Touches DB?               |
| ---------------- | ----------------------------------------------- | ------------------------- |
| Brainstorm       | Local Claude Code skill                         | no                        |
| Draft + edit     | Local Claude Code skill → `.mdx` on disk        | no                        |
| Preview          | `pnpm dev` reads MDX via Velite                 | no                        |
| Publish to web   | `git push` → DO rebuild                         | no (content is in git)    |
| Email to list    | `/admin/campaigns/*` (writes a campaign row)    | yes (`campaigns` table)   |
| Open/click stats | Resend → `/api/webhooks/resend` → DB increments | yes (counters + events)   |

### Common things that go wrong

- **Build fails with Velite/Zod error** — frontmatter doesn't match
  `frontmatter-spec.md`. Check enum values, `publishedAt` format, that
  `number` is an integer.
- **Pullquote renders as a normal blockquote** — `>>>` must be at the
  start of the line (CommonMark parses it as three nested `>` first;
  the remark plugin walks that AST). No leading spaces.
- **Essay missing from listing but URL works** — `status: draft`. Flip
  to `published` and re-push.
- **Cron didn't pick up a scheduled campaign** — check GitHub Actions
  → "cron-send-campaigns" runs. Most common cause: `CRON_SECRET` /
  `SITE_URL` repo secrets unset, or `scheduledFor` is in the future.
- **Webhook events not landing** — Resend dashboard → Webhooks → verify
  the signing secret in DO env matches and the endpoint URL is
  `https://tinytrauma.in/api/webhooks/resend`.

---

## Pulling Instagram inspirations into the catalog

A local-only pipeline that turns posts you've already saved into Instagram
collections into a searchable catalog of writing seeds at
`inspirations/instagram/posts/`. The catalog is git-tracked (so it travels
across machines) but **never enters the deployed app build** — Velite globs
`content/**` only and nothing imports from `inspirations/`.

The pipeline uses **your own logged-in Chrome session** via the
[Claude in Chrome](https://claude.ai/chrome) extension — no scrapers, no
third-party API, no ToS-violating bot detection.

### One-time setup

- [ ] Install the **Claude in Chrome** extension and confirm it shows
      "Connected" in the popup.
- [ ] Sign into Instagram in that Chrome profile.
- [ ] In Instagram, create one or more **Saved Collections** dedicated to
      Tiny Trauma material (e.g. `tiny-trauma-musings`,
      `tiny-trauma-shorts`, `overheard`). Save posts into those collections
      as you scroll.
- [ ] Open each collection in your browser and copy its URL (format:
      `https://www.instagram.com/<you>/saved/<collection-name>/<numeric-id>/`).
- [ ] Edit `inspirations/instagram/collections.json` and replace the
      placeholder entries with your real URLs. Set `default_seed_type` to
      `"musing"`, `"short"`, or `null` per collection (controls how the
      writing skill prefers/orders them at Step 1a / 2a).

### Running an ingest

From the repo root, in Claude Code:

```
> /skill tt-instagram-ingest
```

What happens:

1. Skill reads `inspirations/instagram/collections.json` and
   `inspirations/instagram/_url_registry.json`.
2. For each collection: navigates Chrome to the collection URL, scrolls
   until lazy-loading stabilizes, extracts every post URL.
3. Diffs against the registry — only **new** URLs are fetched.
4. For each new post: opens the post, captures the caption, translates
   Hindi/Hinglish → English if needed, runs the Tiny-Trauma analysis
   (Friction / Seed line / Voice / Essay angle / Short angle / Notable
   quote / Raw caption), and writes one `.mdx` to
   `inspirations/instagram/posts/`.
5. Registry is updated after every single file write — partial runs are
   safe.
6. Prints a summary: `N new posts ingested across M collections`.

Idempotent. Re-run as often as you want; it does nothing when there are no
new saves.

Other modes:

- `mode=dry-run` — list which URLs would be fetched, fetch nothing.
- `mode=rebuild-registry` — scan `posts/*.mdx` and rebuild
  `_url_registry.json` from their frontmatter (recovery path).

### What each catalog post looks like

```yaml
---
post_number: 7
url: "https://www.instagram.com/p/XXXX/"
creator: "@handle"
collection: "tiny-trauma-musings"
collection_meta:
  name: "tiny-trauma-musings"
  url: "https://www.instagram.com/.../saved/tiny-trauma-musings/.../"
  default_seed_type: "musing"
ingested_at: "2026-05-18"
title: "what the line above the bus stop said"
seed_type: "musing"
tone_tags: [bangalore, small humiliations]
heat: high               # high | medium | low — gut signal
status: unused           # unused | drafting | shipped:<slug>
language_source: english
---

# what the line above the bus stop said

## Friction
One sentence — the small daily friction this evokes.

## Seed line
The single image or phrase to remember.

## Voice
mine | observed | overheard | text-on-screen

## Essay angle
One-line thesis if it could become a musing. Else: —

## Short angle
One-line premise if it could become a short fiction. Else: —

## Notable quote
> Best line from the caption verbatim (translated to English if the source
> was Hindi/Hinglish).

## Raw caption
{full caption, original language preserved}
```

### Searching the catalog locally

The catalog is just a folder of Markdown files. Use whatever you already
have:

```bash
# every high-heat unused post
rg -l 'heat: high' inspirations/instagram/posts | xargs rg -l 'status: unused'

# everything tagged 'bangalore'
rg -l 'tone_tags:.*bangalore' inspirations/instagram/posts

# every IG seed that became a published essay
rg 'status: shipped:' inspirations/instagram/posts

# fuzzy browse (if you have fzf)
fzf --preview 'bat --color=always {}' < <(ls inspirations/instagram/posts/*.mdx)
```

### How it feeds the writing skill

When you run `/skill tiny-trauma-content essay` (or `short`), **Step 2** of
the essay flow (or **Step 1a** of the short flow) reads the catalog,
filters `status: unused`, ranks by heat then recency, and offers the top 5
as a numbered shortlist before the usual "or tell me yours" fallback.

- Pick a number → the writing skill loads that post's Friction + Seed line
  + Raw caption as your opening noticing, **and immediately flips the
  catalog post's `status` from `unused` to `drafting`**. If you abandon
  the session, the catalog reflects that the seed was chewed on (it won't
  show up in the shortlist next time).
- Reply with anything else → the writing skill ignores the catalog and
  uses what you said. The catalog stays untouched.
- Ship the essay → Step 9 of the writing flow flips the catalog post's
  `status` to `shipped:<slug>` and stages the catalog file alongside the
  essay file for the commit. **The loop closes itself** — `rg 'status:
  shipped:'` later tells you exactly which IG seed became which essay.

If `inspirations/instagram/posts/` doesn't exist or has zero unused posts,
the writing skill falls back to its original plain "what have you been
noticing?" opening. The catalog is opt-in by virtue of existing.

### Sharing the generic version

A project-agnostic copy of the ingestion skill lives at
`handoff/skills/instagram-saves-catalog/`. It's not installed into
`.claude/skills/` — when you want it in your global library, cut & move:

```bash
cp -R handoff/skills/instagram-saves-catalog ~/.claude/skills/
```

The generic version takes `--workspace`, `--collections`, and
`--analysis-template` as arguments, so anyone can point it at their own
output directory with their own per-post analysis template. The
TT-private version (`tt-instagram-ingest`) is a thin wrapper that
hardcodes the paths and bundles the Tiny-Trauma analysis template.

### Common things that go wrong

- **"collections.json is empty"** — you haven't replaced the placeholder
  entries. Edit the file with real Instagram collection URLs.
- **"Placeholder URL detected"** — `<your-handle>` or `<collection-id>`
  is still in a URL. Replace it.
- **Instagram shows login page** — sign into the Chrome profile that owns
  the saved collections and re-run.
- **"No new posts since last run"** — expected on re-runs. Save more
  posts in IG and re-run.
- **Catalog post's `status` didn't flip when you picked it** — the
  writing skill missed Step 2a's status update. Manually edit the
  catalog file's frontmatter; report so the skill prompt gets tightened.
- **Wrong handle in extracted posts** — Chrome is logged into a different
  Instagram account. Switch profiles.
