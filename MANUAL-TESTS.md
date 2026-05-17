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
      `     ---
    title: "A test round trip"
    dek: "Confirming the MDX pipeline picks up new files on save."
    type: musing
    publishedAt: 2026-05-17
    number: 25
    tags: [small humiliations]
    status: published
    ---
    Just a few sentences. ==a small handwritten phrase== for good measure.
    `
      Expect: the file appears at `/musings/test-round-trip` and on the
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
      ```
      curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
        https://<your-site>/api/cron/send-campaigns
      ```
