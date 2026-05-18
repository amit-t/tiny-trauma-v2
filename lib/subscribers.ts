import "server-only";

import { and, asc, desc, eq, inArray, notInArray, sql } from "drizzle-orm";

import { db } from "./db";
import { subscribers } from "@/db/schema";
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

type Row = typeof subscribers.$inferSelect;

function rowToSubscriber(r: Row): Subscriber {
  return {
    id: r.id,
    email: r.email,
    firstName: r.firstName,
    tier: r.tier as SubscriberTier,
    status: r.status as SubscriberStatus,
    source: r.source,
    unsubscribeToken: r.unsubscribeToken,
    createdAt: r.createdAt.getTime(),
    confirmedAt: r.confirmedAt?.getTime() ?? null,
    unsubscribedAt: r.unsubscribedAt?.getTime() ?? null,
  };
}

/**
 * Insert a new pending subscriber. If the email already exists:
 *   - active        → no-op, returns existing (idempotent resubscribe)
 *   - pending       → returns existing with a fresh token (resend confirm)
 *   - unsubscribed  → revives to pending and rotates the token
 *   - bounced/complained → returns existing without resending
 */
export async function createOrRefreshSubscriber(input: {
  email: string;
  firstName?: string;
  tier: SubscriberTier;
  source?: string;
}): Promise<{ subscriber: Subscriber; shouldSendConfirm: boolean }> {
  const email = input.email.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email));

  if (existing) {
    if (existing.status === "active") {
      return { subscriber: rowToSubscriber(existing), shouldSendConfirm: false };
    }
    if (existing.status === "bounced" || existing.status === "complained") {
      return { subscriber: rowToSubscriber(existing), shouldSendConfirm: false };
    }
    const [refreshed] = await db
      .update(subscribers)
      .set({
        status: "pending",
        unsubscribeToken: newToken(),
        unsubscribedAt: null,
        tier: input.tier ?? existing.tier,
        firstName: input.firstName ?? existing.firstName,
        source: input.source ?? existing.source,
      })
      .where(eq(subscribers.id, existing.id))
      .returning();
    return { subscriber: rowToSubscriber(refreshed!), shouldSendConfirm: true };
  }

  const [row] = await db
    .insert(subscribers)
    .values({
      id: newId(),
      email,
      firstName: input.firstName ?? null,
      tier: input.tier,
      status: "pending",
      source: input.source ?? null,
      unsubscribeToken: newToken(),
      createdAt: new Date(),
    })
    .returning();
  return { subscriber: rowToSubscriber(row!), shouldSendConfirm: true };
}

export async function findByToken(token: string): Promise<Subscriber | null> {
  const [row] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.unsubscribeToken, token));
  return row ? rowToSubscriber(row) : null;
}

export async function findById(id: string): Promise<Subscriber | null> {
  const [row] = await db.select().from(subscribers).where(eq(subscribers.id, id));
  return row ? rowToSubscriber(row) : null;
}

export async function findByEmail(email: string): Promise<Subscriber | null> {
  const [row] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email.trim().toLowerCase()));
  return row ? rowToSubscriber(row) : null;
}

export async function confirmSubscriber(id: string): Promise<void> {
  await db
    .update(subscribers)
    .set({ status: "active", confirmedAt: new Date() })
    .where(and(eq(subscribers.id, id), eq(subscribers.status, "pending")));
}

export async function unsubscribe(id: string): Promise<void> {
  await db
    .update(subscribers)
    .set({ status: "unsubscribed", unsubscribedAt: new Date() })
    .where(eq(subscribers.id, id));
}

export async function deleteSubscriber(id: string): Promise<void> {
  await db.delete(subscribers).where(eq(subscribers.id, id));
}

export async function markBounced(email: string): Promise<void> {
  await db
    .update(subscribers)
    .set({ status: "bounced" })
    .where(
      and(
        eq(subscribers.email, email.trim().toLowerCase()),
        notInArray(subscribers.status, ["unsubscribed", "complained"]),
      ),
    );
}

export async function markComplained(email: string): Promise<void> {
  await db
    .update(subscribers)
    .set({ status: "complained" })
    .where(eq(subscribers.email, email.trim().toLowerCase()));
}

export async function listAllSubscribers(): Promise<Subscriber[]> {
  const rows = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
  return rows.map(rowToSubscriber);
}

export type Segment = "weekly" | "monthly" | "both" | "all";

export async function listActiveBySegment(segment: Segment): Promise<Subscriber[]> {
  const tierFilter =
    segment === "weekly"
      ? inArray(subscribers.tier, ["weekly", "both"])
      : segment === "monthly"
        ? inArray(subscribers.tier, ["monthly", "both"])
        : segment === "both"
          ? eq(subscribers.tier, "both")
          : undefined;

  const rows = await db
    .select()
    .from(subscribers)
    .where(
      tierFilter
        ? and(eq(subscribers.status, "active"), tierFilter)
        : eq(subscribers.status, "active"),
    )
    .orderBy(asc(subscribers.createdAt));
  return rows.map(rowToSubscriber);
}

export async function countByStatus(): Promise<Record<SubscriberStatus, number>> {
  const rows = await db
    .select({ status: subscribers.status, n: sql<number>`count(*)::int` })
    .from(subscribers)
    .groupBy(subscribers.status);
  const out: Record<SubscriberStatus, number> = {
    pending: 0,
    active: 0,
    unsubscribed: 0,
    bounced: 0,
    complained: 0,
  };
  for (const r of rows) out[r.status as SubscriberStatus] = r.n;
  return out;
}
