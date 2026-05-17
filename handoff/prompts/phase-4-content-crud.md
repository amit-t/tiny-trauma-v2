# Phase 4 · Content CRUD (the heart)

Drizzle schema, migrations, editor, publish flow. Replace sample data on public
pages with DB reads. This is the longest phase — work carefully.

## Steps

### 4.1 Schema

1. Create `db/index.ts` with the postgres-js client + drizzle wrapper.
2. Create `db/schema.ts` with the tables from `handoff/ARCHITECTURE.md` —
   focus on `users`, `posts`, `post_revisions` for this phase. Add the others
   (subscribers, campaigns, brainstorms, cross_posts, subscribe_events) so
   migrations are forward-compatible, but only wire the first three.
3. `drizzle.config.ts` at repo root pointing at `db/schema.ts`.
4. Run `pnpm db:generate` → check migration into `db/migrations/`.
5. Run `pnpm db:migrate` against a Neon dev branch (or local docker postgres).

### 4.2 Auth → Drizzle

Swap Better Auth's session store from SQLite (or in-memory) to Postgres via a
Drizzle adapter. Migrate the existing session table if needed.

### 4.3 Seed

`db/seed.ts` — populate the DB with the same essays + shorts from
`lib/sample-data.ts`. Run via `pnpm tsx db/seed.ts` (add tsx as a dev dep).
After seeding, public pages should read from DB, not the sample file.

### 4.4 Public pages read from DB

Replace each public page's data fetch with a Drizzle query. RSC by default.
Add `export const revalidate = 3600` to public list/detail pages.

### 4.5 Editor

`app/admin/posts/[id]/page.tsx` — the editor.

Layout:
- Top: title input (large, Fraunces, contenteditable). Below: dek input (italic,
  smaller).
- Left/main: TipTap editor with starter-kit, Link, Placeholder, and three
  custom extensions:
  - **HandInline** (mark) — `==text==` toggles. Renders as
    `<span class="hand-inline">…</span>` in preview.
  - **HandAside** (block) — `[[aside]] text` toggles. Renders as
    `<HandAside>`.
  - **PullQuote** (block) — `>>> text` toggles. Renders as `<PullQuote>`.
- Right sidebar: type picker, slug (auto, editable), tags (multi-select),
  status badge, scheduled-for picker, featured toggle, hero image upload
  (phase 4 just accepts a URL), word count (auto), reading time (auto).
- Bottom toolbar: "save draft" (autosaves every 4s anyway), "preview" (opens
  `/admin/posts/[id]/preview` in new tab), "schedule" / "publish".

Editor content stored as **markdown** (TipTap → markdown via a small custom
serializer; the three extensions emit their special syntax). On read, the
markdown is parsed back to TipTap state.

Autosave: server action `saveDraft(id, patch)` debounced 4s. Snapshot revision
on big diffs or every 5 minutes.

### 4.6 Preview

`app/admin/posts/[id]/preview/page.tsx` — server component that fetches the
draft and renders it in the **real public layout** (Musing detail or Short
detail depending on type). Adds a "draft preview" pill in the corner.

### 4.7 Publish flow

Server actions in `app/admin/posts/actions.ts`:

- `publishNow(id)` — flips to published, sets publishedAt, assigns number if
  null, revalidates public paths.
- `schedule(id, when)` — flips to scheduled, sets scheduledFor.
- `unschedule(id)` — back to draft.
- `archive(id)` — flips to archived (post hidden from public lists).

### 4.8 Cron publisher

`app/api/cron/publish/route.ts`:

- Triggered by Vercel cron (every hour). For local: also expose a manual
  "publish now" button in admin for testing.
- Query: scheduled posts where `scheduledFor <= now()`.
- For each: flip to published, set publishedAt, assign number, revalidate paths.
- Auth: check `Authorization: Bearer ${CRON_SECRET}`. Set `CRON_SECRET` in env.

Vercel cron config — `vercel.json`:
```json
{ "crons": [
    { "path": "/api/cron/publish", "schedule": "0 * * * *" }
] }
```

### 4.9 Admin posts list

`app/admin/posts/page.tsx`:

- Table of posts: number, title, type chip, status chip, scheduled/published date,
  actions (edit, archive).
- Filter by status (all / draft / scheduled / published / archived).
- Sort by updatedAt desc by default.
- "Start a new musing" / "Start a new short" buttons at the top.

### 4.10 Dashboard stats

`app/admin/page.tsx` — fill in real numbers:

- Drafts count
- Scheduled count
- Published count
- Last action — "you last edited *Why I cry…* 4 hours ago." (in voice)

## Acceptance

- [ ] Migration runs cleanly.
- [ ] Seed populates posts. Public site reads from DB.
- [ ] Create a new musing → write 3 paragraphs → save draft (auto + manual).
- [ ] Preview opens, looks identical to a real published essay.
- [ ] Use `==phrase==` → renders handwritten coral on preview.
- [ ] Use `>>> quote` → renders pullquote on preview.
- [ ] Use `[[aside]] note` → renders handwritten block aside.
- [ ] Schedule for 2 minutes from now → manually trigger cron → essay
      appears on `/musings`.
- [ ] Archive an essay → it disappears from public list.
- [ ] Revisions appear in `post_revisions` after edits.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass.

## Commit (multiple commits — split logically)

```
feat(db): drizzle schema, migrations, seed
feat(admin): tiptap editor with handwritten/pullquote/aside extensions
feat(admin): autosave, revisions, preview
feat(admin): publish/schedule/archive actions
feat(cron): hourly scheduled-publish job
feat(public): read from db instead of sample data
```

Stop. Ask user to publish something end-to-end before phase 5.
