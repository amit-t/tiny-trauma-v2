"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth-helpers";
import {
  deleteSubscriber as deleteSubscriberRow,
  listAllSubscribers,
  unsubscribe as unsubscribeRow,
} from "@/lib/subscribers";
import { logEvent } from "@/lib/events";

export async function unsubscribeSubscriber(id: string) {
  await requireOwner();
  await unsubscribeRow(id);
  await logEvent({
    subscriberId: id,
    campaignId: null,
    kind: "complained",
    meta: { via: "admin" },
  });
  revalidatePath("/admin/subscribers");
}

export async function deleteSubscriberAction(id: string) {
  await requireOwner();
  await deleteSubscriberRow(id);
  revalidatePath("/admin/subscribers");
}

export async function exportSubscribersCsv() {
  await requireOwner();
  const rows = await listAllSubscribers();
  const header = [
    "email",
    "first_name",
    "tier",
    "status",
    "source",
    "created_at",
    "confirmed_at",
    "unsubscribed_at",
  ].join(",");
  const lines = rows.map((r) =>
    [
      csv(r.email),
      csv(r.firstName ?? ""),
      r.tier,
      r.status,
      csv(r.source ?? ""),
      iso(r.createdAt),
      iso(r.confirmedAt),
      iso(r.unsubscribedAt),
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

function csv(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function iso(ms: number | null): string {
  return ms ? new Date(ms).toISOString() : "";
}
