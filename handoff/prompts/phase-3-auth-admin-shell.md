# Phase 3 · Auth + admin shell

Wire Better Auth with magic-link email. Build the admin layout and stub pages.
No CRUD yet — that's phase 4. Just the shell.

## Steps

1. **Set up Better Auth** (`lib/auth.ts`):
   - Magic link strategy only (no password).
   - Email sender: Resend.
   - Sessions stored in DB (we'll add a Drizzle adapter — for now, file-backed
     SQLite session store is fine; switch to Postgres in phase 4 when schema lands).
   - `BETTER_AUTH_SECRET` from env.

2. **Owner check**:
   - On every sign-in, check `email === env.OWNER_EMAIL`. Non-owners get a
     polite "this is a one-person blog" page and no session.
   - Add `lib/auth-helpers.ts` with `requireOwner()` server util — throws
     redirect to `/sign-in` if no session.

3. **Routes**:
   - `app/sign-in/page.tsx` — Just the wordmark, an email input, and a button.
     "send me a link". On success: "check your inbox. the link is good for 15
     minutes."
   - `app/api/auth/[...all]/route.ts` — Better Auth handler.

4. **Magic link email** — use `react-email`:
   - Subject: "your tiny trauma sign-in link"
   - Body: in voice — *"here's your link. it expires in 15 minutes, mostly
     because it should."* + `<Button href={link}>sign in</Button>`
   - Footer: same colophon style as the public site but condensed.

5. **Admin shell** — `app/admin/layout.tsx`:
   - Server component that calls `requireOwner()`.
   - Layout: a top bar (brand left, owner email + "sign out" right) and a
     left sidebar with nav links.
   - Visual register: same fonts, same tokens, but denser. Editorial CMS feel,
     not consumer feel.
   - Sidebar items: Dashboard, Posts, Brainstorm, Campaigns, Subscribers,
     Cross-post, Settings. Active state matches public nav (coral underline).
   - Theme toggle in the top bar.

6. **Stub pages**:
   - `app/admin/page.tsx` — "tiny trauma · workshop" heading + 4 stats placeholder
     cards (drafts, scheduled, subscribers, last sent) — all show "—" for now.
   - `app/admin/posts/page.tsx` — heading "Posts" + empty state: *"no posts yet.
     [start one →](/admin/posts/new)"*
   - `app/admin/brainstorm/page.tsx` — heading "Brainstorm" + *"no threads.
     start a new one when you have something half-formed."*
   - `app/admin/campaigns/page.tsx` — heading "Campaigns" + *"no campaigns. you
     have to publish something first."*
   - `app/admin/subscribers/page.tsx` — heading "Subscribers" + table headers
     visible, empty body row reading *"no subscribers yet. probably for the best."*
   - `app/admin/cross-post/page.tsx` — heading "Cross-post" + *"pick a published
     essay to generate platform versions."*
   - `app/admin/settings/page.tsx` — heading "Settings" + read-only display of
     env keys present (just truthy/falsy, never the values).

7. **Style** — admin variants in `app/globals.css`:
   - `--admin-bg`, `--admin-surface`, `--admin-rule` aliases that are slightly
     denser than public (e.g. admin uses `--surface` as the page bg to feel like
     a workshop).
   - Tighter scale: body 14px instead of 15.5px. Headings drop one step.

## Acceptance

- [ ] Visit `/admin` while signed out → redirected to `/sign-in`.
- [ ] Submit email → magic link arrives in Resend.
- [ ] Click link → land on `/admin` signed in.
- [ ] Sign in with non-OWNER email → polite refusal page.
- [ ] All 7 stub pages render with the right header + empty state copy.
- [ ] Theme toggle works in admin.
- [ ] `pnpm typecheck` and `pnpm lint` pass.

## Commit

```
feat(auth+admin): magic-link auth, owner gate, admin shell + stub pages
```

Stop. Ask user to sign in end-to-end before phase 4.
