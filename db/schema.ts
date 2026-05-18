import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/* ============================================================
   Better-auth tables — column names must match better-auth's
   default field map (camelCase). Don't rename without also
   passing a `fields` mapping to drizzleAdapter.
   ============================================================ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: false }).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: false }).notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expiresAt", { mode: "date", withTimezone: false }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: false }).notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: false }).notNull(),
  },
  (t) => ({
    userIdx: index("session_user_idx").on(t.userId),
    tokenIdx: index("session_token_idx").on(t.token),
  }),
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
      mode: "date",
      withTimezone: false,
    }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
      mode: "date",
      withTimezone: false,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: false }).notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: false }).notNull(),
  },
  (t) => ({
    userIdx: index("account_user_idx").on(t.userId),
  }),
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { mode: "date", withTimezone: false }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: false }).notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: false }).notNull(),
  },
  (t) => ({
    identifierIdx: index("verification_identifier_idx").on(t.identifier),
  }),
);

/* ============================================================
   App tables — snake_case columns (Postgres-idiomatic). We
   keep millisecond epochs out of the public API by converting
   in the lib/* query layer; column type stays `timestamp`.
   ============================================================ */

export const subscribers = pgTable(
  "subscribers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    firstName: text("first_name"),
    tier: text("tier").notNull().default("weekly"), // weekly | monthly | both
    status: text("status").notNull().default("pending"), // pending | active | unsubscribed | bounced | complained
    source: text("source"), // home | about | newsletter | footer | manual
    unsubscribeToken: text("unsubscribe_token").notNull().unique(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: false }).notNull(),
    confirmedAt: timestamp("confirmed_at", { mode: "date", withTimezone: false }),
    unsubscribedAt: timestamp("unsubscribed_at", { mode: "date", withTimezone: false }),
  },
  (t) => ({
    statusIdx: index("subscribers_status_idx").on(t.status),
    tokenIdx: index("subscribers_token_idx").on(t.unsubscribeToken),
  }),
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: text("id").primaryKey(),
    postSlug: text("post_slug").notNull(),
    postType: text("post_type").notNull(), // musing | short
    subject: text("subject").notNull(),
    preheader: text("preheader").notNull().default(""),
    personalNote: text("personal_note"),
    bodySnapshot: text("body_snapshot").notNull(),
    segment: text("segment").notNull().default("weekly"), // weekly | monthly | both | all
    scheduledFor: timestamp("scheduled_for", { mode: "date", withTimezone: false }),
    status: text("status").notNull().default("draft"), // draft | scheduled | sending | sent | failed
    sentAt: timestamp("sent_at", { mode: "date", withTimezone: false }),
    sentCount: integer("sent_count").notNull().default(0),
    openCount: integer("open_count").notNull().default(0),
    clickCount: integer("click_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: false }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: false }).notNull(),
  },
  (t) => ({
    statusIdx: index("campaigns_status_idx").on(t.status),
    scheduledIdx: index("campaigns_scheduled_idx").on(t.scheduledFor),
  }),
);

export const subscribeEvents = pgTable(
  "subscribe_events",
  {
    id: text("id").primaryKey(),
    subscriberId: text("subscriber_id").references(() => subscribers.id, {
      onDelete: "cascade",
    }),
    campaignId: text("campaign_id").references(() => campaigns.id, {
      onDelete: "set null",
    }),
    kind: text("kind").notNull(), // sent | delivered | opened | clicked | bounced | complained
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: false }).notNull(),
  },
  (t) => ({
    subIdx: index("subscribe_events_sub_idx").on(t.subscriberId),
    campaignIdx: index("subscribe_events_campaign_idx").on(t.campaignId),
    kindIdx: index("subscribe_events_kind_idx").on(t.kind),
  }),
);
