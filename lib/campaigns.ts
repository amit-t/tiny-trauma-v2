import "server-only";

import { appDb, nowMs } from "./app-db";
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

type Row = {
  id: string;
  post_slug: string;
  post_type: "musing" | "short";
  subject: string;
  preheader: string;
  personal_note: string | null;
  body_snapshot: string;
  segment: Segment;
  scheduled_for: number | null;
  status: CampaignStatus;
  sent_at: number | null;
  sent_count: number;
  open_count: number;
  click_count: number;
  failed_count: number;
  created_at: number;
  updated_at: number;
};

function rowToCampaign(r: Row): Campaign {
  return {
    id: r.id,
    postSlug: r.post_slug,
    postType: r.post_type,
    subject: r.subject,
    preheader: r.preheader,
    personalNote: r.personal_note,
    bodySnapshot: r.body_snapshot,
    segment: r.segment,
    scheduledFor: r.scheduled_for,
    status: r.status,
    sentAt: r.sent_at,
    sentCount: r.sent_count,
    openCount: r.open_count,
    clickCount: r.click_count,
    failedCount: r.failed_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function createCampaign(input: {
  postSlug: string;
  postType: "musing" | "short";
  subject: string;
  preheader: string;
  bodySnapshot: string;
}): Campaign {
  const id = newId();
  const t = nowMs();
  appDb
    .prepare(
      `INSERT INTO campaigns (
         id, post_slug, post_type, subject, preheader, body_snapshot,
         segment, status, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'weekly', 'draft', ?, ?)`,
    )
    .run(
      id,
      input.postSlug,
      input.postType,
      input.subject,
      input.preheader,
      input.bodySnapshot,
      t,
      t,
    );
  return findCampaign(id)!;
}

export function findCampaign(id: string): Campaign | null {
  const row = appDb.prepare("SELECT * FROM campaigns WHERE id = ?").get(id) as
    | Row
    | undefined;
  return row ? rowToCampaign(row) : null;
}

export function updateCampaign(
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
): void {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (patch.subject !== undefined) {
    sets.push("subject = ?");
    params.push(patch.subject);
  }
  if (patch.preheader !== undefined) {
    sets.push("preheader = ?");
    params.push(patch.preheader);
  }
  if (patch.personalNote !== undefined) {
    sets.push("personal_note = ?");
    params.push(patch.personalNote);
  }
  if (patch.bodySnapshot !== undefined) {
    sets.push("body_snapshot = ?");
    params.push(patch.bodySnapshot);
  }
  if (patch.segment !== undefined) {
    sets.push("segment = ?");
    params.push(patch.segment);
  }
  if (patch.scheduledFor !== undefined) {
    sets.push("scheduled_for = ?");
    params.push(patch.scheduledFor);
  }
  if (patch.status !== undefined) {
    sets.push("status = ?");
    params.push(patch.status);
  }
  if (sets.length === 0) return;
  sets.push("updated_at = ?");
  params.push(nowMs());
  params.push(id);
  appDb.prepare(`UPDATE campaigns SET ${sets.join(", ")} WHERE id = ?`).run(...params);
}

export function markCampaignSent(
  id: string,
  sentCount: number,
  failedCount: number,
): void {
  appDb
    .prepare(
      `UPDATE campaigns
       SET status = ?, sent_at = ?, sent_count = ?, failed_count = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      failedCount > sentCount ? "failed" : "sent",
      nowMs(),
      sentCount,
      failedCount,
      nowMs(),
      id,
    );
}

export function incrementCampaignCounter(
  id: string,
  field: "open_count" | "click_count",
): void {
  appDb.prepare(`UPDATE campaigns SET ${field} = ${field} + 1 WHERE id = ?`).run(id);
}

export function listCampaigns(): Campaign[] {
  const rows = appDb
    .prepare("SELECT * FROM campaigns ORDER BY created_at DESC")
    .all() as Row[];
  return rows.map(rowToCampaign);
}

export function listSentCampaigns(): Campaign[] {
  const rows = appDb
    .prepare("SELECT * FROM campaigns WHERE status = 'sent' ORDER BY sent_at DESC")
    .all() as Row[];
  return rows.map(rowToCampaign);
}

export function listDueScheduledCampaigns(): Campaign[] {
  const rows = appDb
    .prepare(
      `SELECT * FROM campaigns
       WHERE status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= ?
       ORDER BY scheduled_for ASC`,
    )
    .all(nowMs()) as Row[];
  return rows.map(rowToCampaign);
}
