# ARCHITECTURE.md — Tiny Trauma v2

## High-level

```
                    ┌─────────────────────────────────┐
                    │   Public site (RSC, edge cache) │
                    │   /  /musings  /shorts  /about  │
                    │   /newsletter  /[type]/[slug]   │
                    └─────────────┬───────────────────┘
                                  │ reads
                                  ▼
                    ┌─────────────────────────────────┐
                    │   Postgres (Neon)               │
                    │   posts · subscribers ·         │
                    │   campaigns · brainstorms       │
                    └─────────────▲───────────────────┘
                                  │ writes
                                  │
                    ┌─────────────┴───────────────────┐
                    │   Admin (/admin/*, auth-gated)  │
                    │   editor, drafts, campaigns,    │
                    │   subscribers, ai workshop      │
                    └─────────────┬───────────────────┘
                                  │ calls
                ┌─────────────────┼──────────────────┐
                ▼                 ▼                  ▼
         ┌────────────┐    ┌────────────┐     ┌────────────┐
         │  Anthropic │    │   Resend   │     │  Plausible │
         │  (brain-   │    │  (email)   │     │  (stats,   │
         │   storm,   │    │            │     │   phase 5) │
         │   edits)   │    │            │     │            │
         └────────────┘    └────────────┘     └────────────┘
```

## Routes

### Public (cached, ISR, fast)

| Path                  | What                                    |
|-----------------------|-----------------------------------------|
| `/`                   | Home — hero + recent musings + featured short + newsletter band |
| `/musings`            | List of all essays, year-grouped, filterable |
| `/musings/[slug]`     | Essay detail — reading view             |
| `/shorts`             | List of all short fictions              |
| `/shorts/[slug]`      | Short fiction detail                    |
| `/about`              | About page                              |
| `/newsletter`         | Subscribe + FAQ + past letters          |
| `/feed.xml`           | RSS                                     |
| `/sitemap.xml`        | Sitemap                                 |
| `/robots.txt`         | Robots                                  |
| `/api/subscribe`      | POST endpoint (email + tier)            |
| `/api/unsubscribe`    | GET with token from email footer        |
| `/api/webhooks/resend`| Bounce/complaint handling               |

### Admin (`/admin/*`, auth-gated; redirects to login if not owner)

| Path                          | What                                  |
|-------------------------------|---------------------------------------|
| `/admin`                      | Dashboard: counts, last actions       |
| `/admin/posts`                | All posts, status filter              |
| `/admin/posts/new`            | Create — pick type (musing/short)     |
| `/admin/posts/[id]`           | Edit — tiptap editor + side panel     |
| `/admin/posts/[id]/preview`   | Server-render preview in real layout  |
| `/admin/brainstorm`           | AI workshop — long form chat-with-claude attached to a draft |
| `/admin/campaigns`            | Newsletter campaigns list             |
| `/admin/campaigns/new`        | Build a campaign from a post          |
| `/admin/campaigns/[id]`       | Edit + schedule + preview             |
| `/admin/subscribers`          | Subscriber list, search, export       |
| `/admin/cross-post`           | Generate twitter/linkedin from a post |
| `/admin/settings`             | Site-level settings, API keys check   |

### Auth

| Path                  | What                                    |
|-----------------------|-----------------------------------------|
| `/sign-in`            | Email magic-link sign-in                |
| `/api/auth/[...all]`  | Better Auth handler                     |

## Data model (Drizzle schema sketch)

```ts
// db/schema.ts
import { pgTable, text, timestamp, varchar, integer, jsonb, boolean, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 120 }),
  isOwner: boolean("is_owner").notNull().default(false), // exactly one true row
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type", { enum: ["musing", "short"] }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: text("title").notNull(),         // can contain inline <em>
  dek: text("dek"),                       // standfirst
  body: text("body").notNull(),           // markdown
  tags: text("tags").array().notNull().default([]),
  number: integer("number"),              // monotonic per-type display number
  status: text("status", { enum: ["draft", "scheduled", "published", "archived"] }).notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  scheduledFor: timestamp("scheduled_for"),
  featured: boolean("featured").notNull().default(false),
  heroImage: text("hero_image"),          // optional URL/path
  readingTimeSeconds: integer("reading_time_seconds"),
  wordCount: integer("word_count"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const postRevisions = pgTable("post_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  reason: text("reason"),                 // "manual save", "ai edit accepted", etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 120 }),
  tier: text("tier", { enum: ["weekly", "monthly", "both"] }).notNull().default("weekly"),
  status: text("status", { enum: ["pending", "active", "unsubscribed", "bounced"] }).notNull().default("pending"),
  unsubscribeToken: varchar("unsubscribe_token", { length: 64 }).notNull(),
  source: text("source"),                 // "home", "newsletter-page", "footer", "post"
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  preheader: text("preheader"),
  body: text("body").notNull(),           // markdown — usually mirrors post body
  segment: text("segment", { enum: ["weekly", "monthly", "both", "all"] }).notNull().default("weekly"),
  status: text("status", { enum: ["draft", "scheduled", "sending", "sent", "failed"] }).notNull().default("draft"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  sentCount: integer("sent_count").notNull().default(0),
  openCount: integer("open_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const brainstorms = pgTable("brainstorms", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
  title: text("title"),                   // user-titled or auto-generated
  messages: jsonb("messages").$type<Array<{role:"user"|"assistant", content:string, ts:string}>>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const crossPosts = pgTable("cross_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  platform: text("platform", { enum: ["twitter", "linkedin", "instagram-caption", "bluesky"] }).notNull(),
  body: text("body").notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  status: text("status", { enum: ["draft", "copied", "posted"] }).notNull().default("draft"),
});

export const subscribeEvents = pgTable("subscribe_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriberId: uuid("subscriber_id").references(() => subscribers.id, { onDelete: "cascade" }),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["sent", "opened", "clicked", "bounced", "complained"] }).notNull(),
  at: timestamp("at").notNull().defaultNow(),
});
```

## Key flows

### Publish a post

1. Owner drafts in `/admin/posts/[id]`. Autosave every 4s to `posts.body`,
   snapshot to `post_revisions` on big diffs (>200 chars) or every 5 minutes.
2. Owner clicks "schedule" → modal with date/time defaulting to next Sunday 9am IST.
3. Status flips to `scheduled`. A Vercel cron at `/api/cron/publish` runs hourly,
   flips eligible scheduled rows to `published` and sets `publishedAt = now()`.
4. Optionally chain: "also create a newsletter campaign from this post."
   Creates a `campaigns` row in draft, mirrors body, owner reviews + schedules send.
5. On publish, invalidate ISR paths: `/`, `/musings` (or `/shorts`), `/musings/[slug]`,
   `/feed.xml`, `/sitemap.xml`.

### Subscribe (public)

1. POST `/api/subscribe` with `{ email, firstName?, tier, source }`.
2. Server: insert row with `status="pending"`, generate `unsubscribeToken`.
3. Send double-opt-in email via Resend (template: `confirm-subscription.tsx`).
4. Link in email: `/api/subscribe/confirm?token=...` → flip `status="active"`.
5. Send welcome email — short, in-voice, links to top 3 essays.

### Send a campaign

1. Admin builds in `/admin/campaigns/[id]`. Preview = live render in
   `react-email` component using campaign body.
2. "Send test to me" → sends to owner only.
3. "Schedule" → set `scheduledFor`. Cron `/api/cron/send-campaigns` runs every 5min,
   picks up due campaigns, marks `status="sending"`, batches via Resend audience send
   (or per-subscriber loop with batching of 100), records `subscribe_events` rows.
4. Status flips to `sent` when done. Subject + first paragraph appear on
   `/newsletter` past-letters list within minutes (ISR revalidate).

### AI brainstorm

1. `/admin/brainstorm` opens a chat pane. Optional: attached to a draft (right
   side shows the draft, left side is chat).
2. Messages stream from Anthropic API via a server action that returns a stream.
   System prompt is in `lib/ai/system-prompt.ts` — version-controlled, in-voice
   ("You are helping Amit, the writer of Tiny Trauma. Match his tone: dry, slightly
   literary, lowercase-first, italics for emphasis. Never suggest emoji.").
3. Useful presets: "outline this", "tighten this paragraph", "give me three
   alternative titles", "what's the third theory I'm missing", "find the line
   that's doing the most work".
4. Output can be inserted into the draft body via a "drop into draft" button.

### AI editing (inline in the editor)

1. Select text in TipTap, popover appears with quick actions: tighten, expand,
   rewrite-in-voice, fix-flow, suggest-italics.
2. Server action calls Claude Haiku for speed.
3. Diff view: original vs suggestion, accept/reject. On accept, replaces selection
   and snapshots a revision.

### Cross-post

1. From a published post detail in admin, "Generate cross-posts" → spins three
   variants per platform (twitter thread, linkedin post, instagram caption).
2. Server action calls Claude with platform-specific prompts. Stores in `cross_posts`.
3. Owner reviews, edits, clicks "copy to clipboard". (No direct posting in v1 —
   the API keys / oauth flows aren't worth the build effort yet.)

## Caching & revalidation

- All public list/detail routes use `export const revalidate = 3600` (1 hour) + on-publish `revalidatePath` to invalidate immediately.
- Admin routes are `force-dynamic`.
- Static assets (fonts) cached aggressively at the edge.
- Images via `next/image`; placeholder striped panels for posts without hero images.

## Environments

- **Local**: `pnpm dev`, local Neon branch or Docker postgres.
- **Preview**: every PR gets a Vercel preview with its own Neon branch.
- **Production**: main branch → tinytrauma.in.

## Out of scope for v1

- Multi-author / teams
- Comments (replies are by email, on purpose)
- Search (≤ 100 posts; year-grouped list is enough)
- Social oauth posting (cross-post generates copy, user pastes)
- Paid subscriptions / Stripe
- Mobile app
- i18n
