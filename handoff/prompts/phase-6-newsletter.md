# Phase 6 · Newsletter

Public subscribe + admin subscribers + campaign builder + send.

## Steps

### 6.1 Subscribe API

`app/api/subscribe/route.ts`:

- POST with `{ email, firstName?, tier, source }`.
- Validate via zod.
- Insert subscriber with `status="pending"`, generated `unsubscribeToken`
  (32 char hex).
- Send confirm-subscription email via Resend.
- Return JSON `{ ok: true }`.

### 6.2 Confirm subscription

`app/subscribe/confirm/page.tsx`:

- Reads `?token=...` from URL.
- Looks up subscriber by `unsubscribeToken` (yes, reused as confirm token — fine
  for a one-person site).
- Flips `status="active"`, sets `confirmedAt`.
- Renders welcome page in voice: *"you're on the list. the next sunday letter
  will find you. ↳ in the meantime, three essays to start with:"* + links to
  3 most-recent published musings.
- Triggers welcome email (small, in voice, links to top 3).

### 6.3 Unsubscribe

`app/api/unsubscribe/route.ts`:

- GET with `?token=...`.
- Looks up, flips `status="unsubscribed"`.
- Redirects to `/unsubscribed` page: *"you're off the list. no hard feelings.
  if you ever come back, ↳ [the door is always open](/newsletter)."*

### 6.4 React Email templates

Create `emails/`:

- `confirm-subscription.tsx` — subject "confirm your tiny trauma subscription".
  Body in voice: explains what they're getting, button "confirm and start
  reading."
- `welcome.tsx` — subject "you're in. ↳ three essays to start with". Body:
  warm note, three essay links, signature, footer with unsubscribe.
- `essay.tsx` — the main weekly template. Subject = campaign.subject. Body:
  optional personal note (italic), then the essay rendered in Newsreader fallback
  (since Plex Mono is unreliable in email clients), with `<em>` styled coral and
  pullquotes styled as bordered blocks. Footer with unsubscribe.

All emails: warm dark background **does not work in email** — use **light**
palette (cream + dark ink) for emails. Coral accent stays.

### 6.5 Public subscribe forms

Wire the forms on:
- Home (newsletter band)
- About (sidebar mini-form)
- Newsletter page (big subscribe card + small footer CTA)
- Footer email signup if added later

All POST to `/api/subscribe`. On success: replace form with the success
microcopy from the design (e.g. *"check your inbox. it's on the way."*).

### 6.6 Subscribers admin

`app/admin/subscribers/page.tsx`:

- Table: name, email, tier, status, source, subscribed-at.
- Top toolbar: search by email, filter by status/tier, count badge.
- Row hover reveals actions: copy email, unsubscribe, delete.
- "Export CSV" button → server action returns a download.

### 6.7 Campaign builder

`app/admin/campaigns/page.tsx` — list with status filter.
`app/admin/campaigns/new/page.tsx` — pick a published post → pre-fills subject
+ preheader + body, redirects to `[id]`.
`app/admin/campaigns/[id]/page.tsx` — edit:

- Subject input
- Preheader input (with char count, ≤ 90)
- Personal note textarea (optional — appears at top of email in italics)
- Body — full markdown editor (TipTap, same as posts; loaded with post content)
- Segment selector (weekly / monthly / both / all)
- Schedule picker
- Actions: "send test to me", "schedule", "send now"

Preview pane right side: live react-email render at the current state, in an
iframe that simulates Gmail desktop and iOS Mail.

### 6.8 Send

`app/api/cron/send-campaigns/route.ts`:

- Every 5 minutes via Vercel cron.
- Query campaigns where `status="scheduled"` and `scheduledFor <= now()`.
- For each: flip to `sending`, fetch active subscribers in segment, batch by 100,
  call Resend audience send or per-email loop (use the `bulk` Resend feature if
  available).
- Insert `subscribe_events` rows for each `sent`.
- On completion: flip to `sent`, set `sentAt`, `sentCount`.
- On any per-batch failure: log, continue, mark overall as `sent` with the count
  that succeeded.

Vercel cron addition to `vercel.json`:

```json
{ "path": "/api/cron/send-campaigns", "schedule": "*/5 * * * *" }
```

### 6.9 Open/click tracking

`app/api/webhooks/resend/route.ts`:

- Verifies Resend webhook signature.
- For each event (delivered, opened, clicked, bounced, complained), inserts a
  `subscribe_events` row. Updates `subscribers.status` for hard bounces and
  complaints.

Configure the webhook in Resend dashboard → point at production URL.

### 6.10 Public "past letters" reads real campaigns

`app/newsletter/page.tsx` — past letters list now pulls from `campaigns` table
where `status="sent"`, joined with the post for title/dek + open count.

## Acceptance

- [ ] Subscribe from public page → confirm email arrives → click → land on
      welcome page → welcome email arrives.
- [ ] Unsubscribe link works.
- [ ] Admin shows subscriber in the table.
- [ ] Create campaign from a published post → schedule for 2 mins from now →
      cron fires → essay email arrives in inbox.
- [ ] Open the email → after a few minutes, `open_count` on the campaign
      increments.
- [ ] Hard-bouncing email gets flipped to `bounced` automatically.

## Commit

```
feat(newsletter): subscribe + confirm + unsubscribe flows
feat(emails): react-email templates (confirm, welcome, essay)
feat(admin): subscribers table, csv export
feat(admin): campaign builder with live preview, test, schedule, send
feat(cron): send-campaigns job, resend webhook handler
```

Stop. Subscribe yourself, send yourself an essay end-to-end before phase 7.
