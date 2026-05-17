-- Phase 5 application schema (sqlite, file-backed).
-- Phase 6 / deploy switches this to Postgres via Drizzle; the table shapes
-- below match the future schema so the migration is mechanical.

CREATE TABLE IF NOT EXISTS subscribers (
  id                TEXT PRIMARY KEY,
  email             TEXT NOT NULL UNIQUE,
  first_name        TEXT,
  tier              TEXT NOT NULL DEFAULT 'weekly',       -- weekly | monthly | both
  status            TEXT NOT NULL DEFAULT 'pending',      -- pending | active | unsubscribed | bounced | complained
  source            TEXT,                                 -- home | about | newsletter | footer | manual
  unsubscribe_token TEXT NOT NULL UNIQUE,                 -- doubles as confirm token (one-person blog)
  created_at        INTEGER NOT NULL,
  confirmed_at      INTEGER,
  unsubscribed_at   INTEGER
);
CREATE INDEX IF NOT EXISTS subscribers_status_idx ON subscribers(status);
CREATE INDEX IF NOT EXISTS subscribers_token_idx  ON subscribers(unsubscribe_token);

CREATE TABLE IF NOT EXISTS campaigns (
  id              TEXT PRIMARY KEY,
  post_slug       TEXT NOT NULL,
  post_type       TEXT NOT NULL,                          -- musing | short
  subject         TEXT NOT NULL,
  preheader       TEXT NOT NULL DEFAULT '',
  personal_note   TEXT,                                   -- optional italic preamble
  body_snapshot   TEXT NOT NULL,                          -- raw markdown captured at creation
  segment         TEXT NOT NULL DEFAULT 'weekly',         -- weekly | monthly | both | all
  scheduled_for   INTEGER,
  status          TEXT NOT NULL DEFAULT 'draft',          -- draft | scheduled | sending | sent | failed
  sent_at         INTEGER,
  sent_count      INTEGER NOT NULL DEFAULT 0,
  open_count      INTEGER NOT NULL DEFAULT 0,
  click_count     INTEGER NOT NULL DEFAULT 0,
  failed_count    INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS campaigns_status_idx       ON campaigns(status);
CREATE INDEX IF NOT EXISTS campaigns_scheduled_idx    ON campaigns(scheduled_for);

CREATE TABLE IF NOT EXISTS subscribe_events (
  id            TEXT PRIMARY KEY,
  subscriber_id TEXT REFERENCES subscribers(id) ON DELETE CASCADE,
  campaign_id   TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  kind          TEXT NOT NULL,                            -- sent | delivered | opened | clicked | bounced | complained
  meta          TEXT,                                     -- JSON blob
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS subscribe_events_sub_idx     ON subscribe_events(subscriber_id);
CREATE INDEX IF NOT EXISTS subscribe_events_campaign_idx ON subscribe_events(campaign_id);
CREATE INDEX IF NOT EXISTS subscribe_events_kind_idx    ON subscribe_events(kind);
