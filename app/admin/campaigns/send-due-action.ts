"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth-helpers";
import { listDueScheduledCampaigns } from "@/lib/campaigns";
import { sendCampaignById } from "./actions";

export async function sendDueScheduledCampaigns(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  await requireOwner();
  const due = await listDueScheduledCampaigns();
  let sent = 0;
  let failed = 0;
  for (const c of due) {
    const r = await sendCampaignById(c.id);
    sent += r.sent;
    failed += r.failed;
  }
  revalidatePath("/admin/campaigns");
  return { processed: due.length, sent, failed };
}
