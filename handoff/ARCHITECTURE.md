# ARCHITECTURE.md — Tiny Trauma v2

## Two pieces, clearly separated

```
┌──────────────────────────────────────────────────────────────────────┐
│  LOCAL ONLY — your laptop, inside Claude Code                       │
│                                                                      │
│   ┌─────────────────────────┐                                       │
│   │ tiny-trauma-content     │  brainstorms, drafts, edits           │
│   │ skill (Claude Code)     │  (uses your Claude Code subscription) │
│   └────────────┬────────────┘                                       │
│                │ outputs                                             │
│                ▼                                                     │
│   ┌─────────────────────────┐                                       │
│   │ content/musings/*.mdx   │  ← committed to git                   │
│   │ content/shorts/*.mdx    │                                       │
│   └────────────┬────────────┘                                       │
└────────────────┼────────────────────────────────────────────────────┘
                 │ git push
                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│  DEPLOYED — DigitalOcean                                            │
│                                                                      │
│   ┌─────────────────────────────────┐                               │
│   │   Public site (Next.js, RSC)    │  reads MDX from /content      │
│   │   /  /musings  /shorts  /about  │  rebuild on git push          │
│   │   /newsletter  /[type]/[slug]   │                               │
│   └────────────┬────────────────────┘                               │
│                │ reads/writes                                        │
│                ▼                                                     │
│   ┌─────────────────────────────────┐                               │
│   │   DO Managed Postgres           │  subscribers · campaigns ·    │
│   │                                 │  subscribe_events             │
│   └─────────────────────────────────┘                               │
│                ▲                                                     │
│                │ uses                                                │
│   ┌────────────┴────────────────────┐                               │
│   │   /admin (Better Auth, owner)   │  manage subscribers,          │
│   │                                 │  build & schedule campaigns   │
│   └────────────┬────────────────────┘                               │
│                │ sends via                                           │
│                ▼                                                     │
│         ┌─────────────┐                                              │
│         │   Resend    │                                              │
│         └─────────────┘                                              │
└──────────────────────────────────────────────────────────────────────┘
```

**No Anthropic API calls from the deployed server.** All AI is local.

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
| `/api/cron/send-campaigns` | POST, bearer-token-auth, hourly via GitHub Actions |

### Admin (`/admin/*`, auth-gated; redirects to login if not owner)

| Path                          | What                                  |
|-------------------------------|---------------------------------------|
| `/admin`                      | Dashboard: counts, last sent          |
| `/admin/posts`                | Read-only list of MDX files w/ status (a window into `/content`, not an editor) |
| `/admin/posts/[slug]`         | MDX file viewer — frontmatter on right, rendered body on left, "open in editor" links to your local file (`vscode://file/...`) |
| `/admin/campaigns`            | Newsletter campaigns list             |
| `/admin/campaigns/new`        | Build a campaign from a published MDX file |
| `/admin/campaigns/[id]`       | Edit + schedule + preview             |
| `/admin/subscribers`          | Subscriber list, search, export       |
| `/admin/settings`             | Site-level settings, API keys check   |

### Auth

| Path                  | What                                    |
|-----------------------|-----------------------------------------|
| `/sign-in`            | Email magic-link sign-in                |
| `/api/auth/[...all]`  | Better Auth handler                     |

## Content model — MDX files

**Posts are not in the database.** They live in `/content/musings/*.mdx` and
`/content/shorts/*.mdx`. Full schema in `handoff/CONTENT-MODEL.md`.

The Next.js app uses **Velite** (or **MDX + a small custom loader**) at build
time to:
1. Read every `.mdx` file under `/content/`
2. Validate frontmatter against a Zod schema
3. Generate a typed manifest (`.velite/posts.json`) the app imports
4. Hot-reload in dev when files change

On `git push`, DO App Platform rebuilds; new MDX files appear automatically.

## Data model — Postgres (Drizzle schema)

Only three tables. Posts are NOT here.

```ts
// db/schema.ts
import { pgTable, text, timestamp, varchar, integer, boolean, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 120 }),
  isOwner: boolean("is_owner").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 120 }),
  tier: text("tier", { enum: ["weekly", "monthly", "both"] }).notNull().default("weekly"),
  status: text("status", { enum: ["pending", "active", "unsubscribed", "bounced"] }).notNull().default("pending"),
  unsubscribeToken: varchar("unsubscribe_token", { length: 64 }).notNull(),
  source: text("source"),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  postSlug: varchar("post_slug", { length: 200 }),   // links to an MDX file
  postType: text("post_type", { enum: ["musing", "short"] }),
  subject: text("subject").notNull(),
  preheader: text("preheader"),
  personalNote: text("personal_note"),
  bodySnapshot: text("body_snapshot").notNull(),   // copy of MDX body at the moment of campaign creation; preserved even if post is later edited
  segment: text("segment", { enum: ["weekly", "monthly", "both", "all"] }).notNull().default("weekly"),
  status: text("status", { enum: ["draft", "scheduled", "sending", "sent", "failed"] }).notNull().default("draft"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  sentCount: integer("sent_count").notNull().default(0),
  openCount: integer("open_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

### Publish an essay (the writing flow)

1. Owner invokes `tiny-trauma-content` skill in Claude Code locally.
2. Skill runs a grill-me session: theme, what they noticed this week, tone,
   length. Drafts the essay in voice. Edits with the user.
3. Skill writes `content/musings/<slug>.mdx` with full frontmatter.
4. Owner reviews the file (in editor), tweaks if needed.
5. `git add content/musings/<slug>.mdx && git commit -m "essay: <title>" && git push`
6. DO App Platform autodeploys (~2 min). New essay appears on `/musings/<slug>`,
   `/feed.xml`, `/sitemap.xml`.

### Send a campaign

1. Admin opens `/admin/campaigns/new`, picks a published MDX file.
2. Server reads the MDX, snapshots body into `campaigns.bodySnapshot`,
   pre-fills subject (title without italics), preheader (dek).
3. Owner edits subject/preheader, adds an optional personal note.
4. Preview renders live as a real email (react-email iframe simulation).
5. "Send test to me" → sends to owner only.
6. "Schedule" → set `scheduledFor`. GitHub Actions cron hits
   `/api/cron/send-campaigns` hourly, picks up due campaigns, batches via
   Resend, records `subscribe_events` rows.

### Subscribe (public)

1. POST `/api/subscribe` with `{ email, firstName?, tier, source }`.
2. Insert row with `status="pending"`, generate `unsubscribeToken`.
3. Send double-opt-in email via Resend.
4. Confirm link: `/api/subscribe/confirm?token=...` → `status="active"`.
5. Welcome email — short, in-voice, links to top 3 essays (read from MDX).

## Cron jobs (GitHub Actions)

DO App Platform has no native cron. We use GitHub Actions scheduled workflows
that `curl` cron endpoints with a bearer token.

- `cron-send-campaigns` — hourly. Hits `/api/cron/send-campaigns`.
- No `cron-publish` needed (publishing is `git push`, not a scheduled job).

YAML in `handoff/DEPLOY.md`.

## Caching & revalidation

- All public list/detail routes statically generated at build time from MDX.
- On `git push` → new build → fresh static pages.
- Admin routes are `force-dynamic`.
- Static assets (fonts) cached aggressively.
- Next.js standalone output (`next.config.mjs` → `output: "standalone"`) for
  DO App Platform.

## Environments

- **Local**: `pnpm dev` against a local Postgres in **Docker**. MDX hot-reloads
  on file save.
- **Production**: **DigitalOcean App Platform** deploying from `main` on every
  push. **DigitalOcean Managed Postgres** for the DB. Domain `tinytrauma.in`
  via DO Domains; HTTPS via Let's Encrypt (automatic).

## Out of scope for v1

- Multi-author / teams / roles
- Comments (replies are by email, on purpose)
- Search (≤ 100 posts; year-grouped list is enough)
- In-app AI (use the local skill instead)
- Direct social posting (the skill can generate cross-post copy locally; you paste)
- Paid subscriptions / Stripe
- Mobile app
- i18n
