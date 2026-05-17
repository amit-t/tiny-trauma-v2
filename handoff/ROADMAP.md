# ROADMAP.md — seven phases

Each phase is a Claude Code session. Stop after each, verify, then move on. Don't
combine phases — the boundaries are where things get tested.

## Phase 0 · Bootstrap (≈30 min)

Set up the empty repo: Next.js 15 + TS + Tailwind v4 + Drizzle + Better Auth + Resend
SDK + Anthropic SDK installed. Empty `app/` with a "hello tiny trauma" page in the
right font. ESLint, Prettier, EditorConfig, `.gitignore`, `.env.local.example`.
`README.md` at root explains how to run.

**Deliverable**: `pnpm dev` renders a single page in Newsreader on a warm-cream
background, no errors, no warnings.

→ Prompt: `prompts/phase-0-bootstrap.md`

## Phase 1 · Design system (≈45 min)

Port `design/styles-v3.css` to `app/globals.css` under Tailwind v4 `@theme`. Build
the primitive components — Button, Input, Chip, Cover, Marginalia, PullQuote,
HandwrittenAside, ArtSlot, ThemeToggle. A `/design` route that renders every
component in dark and light, copy-pasted from the design's component sections.

**Deliverable**: `/design` route shows every primitive, dark + light toggle works,
matches `design/index.html` visually pixel-for-pixel for shared chrome.

→ Prompt: `prompts/phase-1-design-system.md`

## Phase 2 · Public site (static, no DB yet) (≈90 min)

Build every public page using hardcoded sample data: home, musings list, musing
detail, shorts list, short detail, about, newsletter. Use the seed data from
`design/musings.html` and the others. Wire navigation. Add `/feed.xml`,
`/sitemap.xml`, `robots.txt`, `not-found.tsx` (404), `error.tsx`. SEO meta tags.

**Deliverable**: Browse every public page on localhost; visually matches
`design/*.html` exactly; lighthouse perf ≥ 95 on home and detail.

→ Prompt: `prompts/phase-2-public-site.md`

## Phase 3 · Auth + admin shell (≈60 min)

Wire Better Auth with magic-link email (Resend). One owner account, determined by
`OWNER_EMAIL` env. Build the `/admin` shell — top bar, side nav, layout that
inherits the design but in a denser editorial-cms register. Empty stub pages for
Posts, Subscribers, Campaigns, Brainstorm, Cross-post, Settings. Each is just a
heading + "nothing here yet" placeholder. Sign-in / sign-out works.

**Deliverable**: Visit `/admin` while logged out → bounced to `/sign-in`. Sign in
with magic link, land on `/admin`. Owner check works (other emails get 403).

→ Prompt: `prompts/phase-3-auth-admin-shell.md`

## Phase 4 · Content CRUD (the heart of the app, ≈3 hours)

Drizzle schema + migration for posts and post_revisions. Replace hardcoded sample
data on public pages with DB reads. Build the admin editor at `/admin/posts/[id]`:
TipTap with markdown, custom marks for `<em>` (italic emphasis), `<mark>`
(handwritten inline phrase), `<aside>` (margin note), `<blockquote class="pull">`.
Sidebar with title, slug, dek, tags, type (musing/short), status, scheduled-for,
featured. Autosave every 4s. Preview opens in new tab to `/admin/posts/[id]/preview`.
Publish, schedule, archive flows. Cron at `/api/cron/publish`.

**Deliverable**: Create a draft → write a real essay → schedule for next Sunday →
cron fires (or manual trigger button in admin for testing) → essay appears on
public `/musings` and `/musings/[slug]`. Revisions saved.

→ Prompt: `prompts/phase-4-content-crud.md`

## Phase 5 · AI workshop (≈2 hours)

Anthropic SDK wired. System prompt in `lib/ai/system-prompt.ts` — version-controlled
voice instructions. Build `/admin/brainstorm`: chat UI, optionally attached to a
draft. Streaming. Save threads to `brainstorms` table. Build inline editor AI
actions: select text in TipTap → popover with "tighten", "expand", "rewrite in
voice", "suggest italics" — server actions hitting Claude Haiku for speed, diff
view, accept/reject.

**Deliverable**: From a draft, select a paragraph, click "tighten", see a diff,
accept it, revision saved. Open brainstorm, ask "give me three alternative titles
for this draft", get them in-voice, click one to set as title.

→ Prompt: `prompts/phase-5-ai-workshop.md`

## Phase 6 · Newsletter (≈2 hours)

Subscribe form on public pages POSTs to `/api/subscribe`. Double-opt-in email
template in `react-email`. Subscribers admin: search, filter by status/tier,
export CSV. Campaigns: create from post (one click), edit subject + preheader,
preview as real email, send test to self, schedule, cron sends in batches.
Unsubscribe link from every email footer works. `/api/webhooks/resend` handles
bounces and complaints.

**Deliverable**: Subscribe from public page → receive confirm email → click link
→ active. Create campaign from a published post → schedule → cron sends → it
arrives in inbox, formatted, unsubscribe works.

→ Prompt: `prompts/phase-6-newsletter.md`

## Phase 7 · Cross-posting + polish (≈90 min)

From a published post, "Generate cross-posts" creates twitter thread, linkedin
post, instagram caption. Each editable, "copy to clipboard" button. Store in
`cross_posts` table for re-use. Polish admin empty states, error states, loading
states — all in voice. Add Plausible script (optional, behind env var).

**Deliverable**: Open a published post, click "generate cross-posts", get three
in-voice variants per platform, edit one, copy. All admin pages have considered
empty/error/loading states.

→ Prompt: `prompts/phase-7-cross-posting.md`

---

## After phase 7

You have a fully working app, deployable to Vercel. Add a custom domain
(tinytrauma.in), set DNS, point Resend to the same domain (verify), set
production env vars, deploy. First essay goes live the next Sunday.

## Phase budget summary

| Phase | Time | Why                                   |
|-------|------|---------------------------------------|
| 0     | 30m  | Foundation                            |
| 1     | 45m  | Design tokens + primitives             |
| 2     | 90m  | Whole public site                     |
| 3     | 60m  | Auth + admin shell                    |
| 4     | 3h   | Editor, schema, publish flow          |
| 5     | 2h   | AI                                    |
| 6     | 2h   | Newsletter                            |
| 7     | 90m  | Cross-post + polish                   |
| **Total** | **≈11.5h** | One long Saturday or two evenings |
