import "server-only";

import { and, asc, desc, eq, isNotNull, lte, sql } from "drizzle-orm";

import { db } from "./db";
import { campaigns } from "@/db/schema";
import { newId } from "./tokens";

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";
export type Segment = "weekly" | "monthly" | "both" | "all";

export type Campaign = {
  id: string;
  postSlug: string;
  postType: "musing" | "short";
  subject: string;
  preheader: string;
  personalNote: string | null;
  bodySnapshot: string;
  segment: Segment;
  scheduledFor: number | null;
  status: CampaignStatus;
  sentAt: number | null;
  sentCount: number;
  openCount: number;
  clickCount: number;
  failedCount: number;
  createdAt: number;
  updatedAt: number;
};

type Row = typeof campaigns.$inferSelect;

function rowToCampaign(r: Row): Campaign {
  return {
    id: r.id,
    postSlug: r.postSlug,
    postType: r.postType as "musing" | "short",
    subject: r.subject,
    preheader: r.preheader,
    personalNote: r.personalNote,
    bodySnapshot: r.bodySnapshot,
    segment: r.segment as Segment,
    scheduledFor: r.scheduledFor?.getTime() ?? null,
    status: r.status as CampaignStatus,
    sentAt: r.sentAt?.getTime() ?? null,
    sentCount: r.sentCount,
    openCount: r.openCount,
    clickCount: r.clickCount,
    failedCount: r.failedCount,
    createdAt: r.createdAt.getTime(),
    updatedAt: r.updatedAt.getTime(),
  };
}

export async function createCampaign(input: {
  postSlug: string;
  postType: "musing" | "short";
  subject: string;
  preheader: string;
  bodySnapshot: string;
}): Promise<Campaign> {
  const now = new Date();
  const [row] = await db
    .insert(campaigns)
    .values({
      id: newId(),
      postSlug: input.postSlug,
      postType: input.postType,
      subject: input.subject,
      preheader: input.preheader,
      bodySnapshot: input.bodySnapshot,
      segment: "weekly",
      status: "draft",
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return rowToCampaign(row!);
}

export async function findCampaign(id: string): Promise<Campaign | null> {
  const [row] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  return row ? rowToCampaign(row) : null;
}

export async function updateCampaign(
  id: string,
  patch: Partial<{
    subject: string;
    preheader: string;
    personalNote: string | null;
    bodySnapshot: string;
    segment: Segment;
    scheduledFor: number | null;
    status: CampaignStatus;
  }>,
): Promise<void> {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.subject !== undefined) values.subject = patch.subject;
  if (patch.preheader !== undefined) values.preheader = patch.preheader;
  if (patch.personalNote !== undefined) values.personalNote = patch.personalNote;
  if (patch.bodySnapshot !== undefined) values.bodySnapshot = patch.bodySnapshot;
  if (patch.segment !== undefined) values.segment = patch.segment;
  if (patch.scheduledFor !== undefined) {
    values.scheduledFor =
      patch.scheduledFor !== null ? new Date(patch.scheduledFor) : null;
  }
  if (patch.status !== undefined) values.status = patch.status;
  if (Object.keys(values).length === 1) return; // only updatedAt
  await db.update(campaigns).set(values).where(eq(campaigns.id, id));
}

export async function markCampaignSent(
  id: string,
  sentCount: number,
  failedCount: number,
): Promise<void> {
  const status = failedCount > sentCount ? "failed" : "sent";
  await db
    .update(campaigns)
    .set({
      status,
      sentAt: new Date(),
      sentCount,
      failedCount,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, id));
}

export async function incrementCampaignCounter(
  id: string,
  field: "openCount" | "clickCount",
): Promise<void> {
  const col = field === "openCount" ? campaigns.openCount : campaigns.clickCount;
  await db
    .update(campaigns)
    .set({ [field]: sql`${col} + 1` })
    .where(eq(campaigns.id, id));
}

export async function listCampaigns(): Promise<Campaign[]> {
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  return rows.map(rowToCampaign);
}

export async function listSentCampaigns(): Promise<Campaign[]> {
  const rows = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.status, "sent"))
    .orderBy(desc(campaigns.sentAt));
  return rows.map(rowToCampaign);
}

export async function listDueScheduledCampaigns(): Promise<Campaign[]> {
  const rows = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.status, "scheduled"),
        isNotNull(campaigns.scheduledFor),
        lte(campaigns.scheduledFor, new Date()),
      ),
    )
    .orderBy(asc(campaigns.scheduledFor));
  return rows.map(rowToCampaign);
}
