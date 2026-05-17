import "server-only";

import { appDb, nowMs } from "./app-db";
import { newId, newToken } from "./tokens";

export type SubscriberStatus =
  | "pending"
  | "active"
  | "unsubscribed"
  | "bounced"
  | "complained";

export type SubscriberTier = "weekly" | "monthly" | "both";

export type Subscriber = {
  id: string;
  email: string;
  firstName: string | null;
  tier: SubscriberTier;
  status: SubscriberStatus;
  source: string | null;
  unsubscribeToken: string;
  createdAt: number;
  confirmedAt: number | null;
  unsubscribedAt: number | null;
};

type Row = {
  id: string;
  email: string;
  first_name: string | null;
  tier: SubscriberTier;
  status: SubscriberStatus;
  source: string | null;
  unsubscribe_token: string;
  created_at: number;
  confirmed_at: number | null;
  unsubscribed_at: number | null;
};

function rowToSubscriber(r: Row): Subscriber {
  return {
    id: r.id,
    email: r.email,
    firstName: r.first_name,
    tier: r.tier,
    status: r.status,
    source: r.source,
    unsubscribeToken: r.unsubscribe_token,
    createdAt: r.created_at,
    confirmedAt: r.confirmed_at,
    unsubscribedAt: r.unsubscribed_at,
  };
}

/**
 * Insert a new pending subscriber. If the email already exists:
 *   - active        → no-op, returns existing (idempotent resubscribe)
 *   - pending       → returns existing with a fresh token (resend confirm)
 *   - unsubscribed  → revives to pending and rotates the token
 *   - bounced/complained → returns existing without resending
 */
export function createOrRefreshSubscriber(input: {
  email: string;
  firstName?: string;
  tier: SubscriberTier;
  source?: string;
}): { subscriber: Subscriber; shouldSendConfirm: boolean } {
  const email = input.email.trim().toLowerCase();
  const existing = appDb
    .prepare("SELECT * FROM subscribers WHERE email = ?")
    .get(email) as Row | undefined;

  if (existing) {
    if (existing.status === "active") {
      return { subscriber: rowToSubscriber(existing), shouldSendConfirm: false };
    }
    if (existing.status === "bounced" || existing.status === "complained") {
      return { subscriber: rowToSubscriber(existing), shouldSendConfirm: false };
    }
    // pending or unsubscribed — refresh.
    const token = newToken();
    appDb
      .prepare(
        `UPDATE subscribers
         SET status = 'pending',
             unsubscribe_token = ?,
             unsubscribed_at = NULL,
             tier = COALESCE(?, tier),
             first_name = COALESCE(?, first_name),
             source = COALESCE(?, source)
         WHERE id = ?`,
      )
      .run(token, input.tier, input.firstName ?? null, input.source ?? null, existing.id);
    const refreshed = appDb
      .prepare("SELECT * FROM subscribers WHERE id = ?")
      .get(existing.id) as Row;
    return { subscriber: rowToSubscriber(refreshed), shouldSendConfirm: true };
  }

  const id = newId();
  const token = newToken();
  appDb
    .prepare(
      `INSERT INTO subscribers (
         id, email, first_name, tier, status, source,
         unsubscribe_token, created_at
       ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
    )
    .run(
      id,
      email,
      input.firstName ?? null,
      input.tier,
      input.source ?? null,
      token,
      nowMs(),
    );
  const row = appDb.prepare("SELECT * FROM subscribers WHERE id = ?").get(id) as Row;
  return { subscriber: rowToSubscriber(row), shouldSendConfirm: true };
}

export function findByToken(token: string): Subscriber | null {
  const row = appDb
    .prepare("SELECT * FROM subscribers WHERE unsubscribe_token = ?")
    .get(token) as Row | undefined;
  return row ? rowToSubscriber(row) : null;
}

export function findById(id: string): Subscriber | null {
  const row = appDb.prepare("SELECT * FROM subscribers WHERE id = ?").get(id) as
    | Row
    | undefined;
  return row ? rowToSubscriber(row) : null;
}

export function findByEmail(email: string): Subscriber | null {
  const row = appDb
    .prepare("SELECT * FROM subscribers WHERE email = ?")
    .get(email.trim().toLowerCase()) as Row | undefined;
  return row ? rowToSubscriber(row) : null;
}

export function confirmSubscriber(id: string): void {
  appDb
    .prepare(
      `UPDATE subscribers
       SET status = 'active', confirmed_at = ?
       WHERE id = ? AND status = 'pending'`,
    )
    .run(nowMs(), id);
}

export function unsubscribe(id: string): void {
  appDb
    .prepare(
      `UPDATE subscribers
       SET status = 'unsubscribed', unsubscribed_at = ?
       WHERE id = ?`,
    )
    .run(nowMs(), id);
}

export function deleteSubscriber(id: string): void {
  appDb.prepare("DELETE FROM subscribers WHERE id = ?").run(id);
}

export function markBounced(email: string): void {
  appDb
    .prepare(
      `UPDATE subscribers SET status = 'bounced'
       WHERE email = ? AND status NOT IN ('unsubscribed','complained')`,
    )
    .run(email.trim().toLowerCase());
}

export function markComplained(email: string): void {
  appDb
    .prepare(
      `UPDATE subscribers SET status = 'complained'
       WHERE email = ?`,
    )
    .run(email.trim().toLowerCase());
}

export function listAllSubscribers(): Subscriber[] {
  const rows = appDb
    .prepare("SELECT * FROM subscribers ORDER BY created_at DESC")
    .all() as Row[];
  return rows.map(rowToSubscriber);
}

export type Segment = "weekly" | "monthly" | "both" | "all";

export function listActiveBySegment(segment: Segment): Subscriber[] {
  let where = "status = 'active'";
  const params: string[] = [];
  if (segment === "weekly") {
    where += " AND tier IN ('weekly','both')";
  } else if (segment === "monthly") {
    where += " AND tier IN ('monthly','both')";
  } else if (segment === "both") {
    where += " AND tier = 'both'";
  }
  // segment === 'all' → no extra filter beyond active.
  const rows = appDb
    .prepare(`SELECT * FROM subscribers WHERE ${where} ORDER BY created_at ASC`)
    .all(...params) as Row[];
  return rows.map(rowToSubscriber);
}

export function countByStatus(): Record<SubscriberStatus, number> {
  const rows = appDb
    .prepare("SELECT status, COUNT(*) AS n FROM subscribers GROUP BY status")
    .all() as { status: SubscriberStatus; n: number }[];
  const out: Record<SubscriberStatus, number> = {
    pending: 0,
    active: 0,
    unsubscribed: 0,
    bounced: 0,
    complained: 0,
  };
  for (const r of rows) out[r.status] = r.n;
  return out;
}
