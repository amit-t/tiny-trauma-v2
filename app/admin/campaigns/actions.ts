"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { render } from "@react-email/components";

import { requireOwner } from "@/lib/auth-helpers";
import { env } from "@/lib/env";
import {
  createCampaign,
  findCampaign,
  updateCampaign,
  type Segment,
} from "@/lib/campaigns";
import { findMusing, findShort, getAllMusings, getAllShorts } from "@/lib/posts";
import { EssayEmail } from "@/emails/essay";
import { sendEssayEmail } from "@/lib/mailer";
import { listActiveBySegment } from "@/lib/subscribers";
import { logEvent } from "@/lib/events";
import { markCampaignSent } from "@/lib/campaigns";

const SUBJECT_STRIP = /\*([^*]+)\*/g;

export async function createCampaignFromPost(formData: FormData) {
  await requireOwner();
  const slug = String(formData.get("slug") ?? "");
  const type = String(formData.get("type") ?? "");
  if (type !== "musing" && type !== "short") return;

  const post = type === "musing" ? findMusing(slug) : findShort(slug);
  if (!post) return;

  const subject = post.title.replace(SUBJECT_STRIP, "$1");
  const preheader = post.dek.replace(SUBJECT_STRIP, "$1").slice(0, 90);

  const c = createCampaign({
    postSlug: post.slug,
    postType: type,
    subject,
    preheader,
    bodySnapshot: post.body,
  });

  redirect(`/admin/campaigns/${c.id}`);
}

export async function saveCampaign(id: string, formData: FormData) {
  await requireOwner();
  const subject = String(formData.get("subject") ?? "");
  const preheader = String(formData.get("preheader") ?? "");
  const personalNote = String(formData.get("personalNote") ?? "");
  const bodySnapshot = String(formData.get("bodySnapshot") ?? "");
  const segment = (String(formData.get("segment") ?? "weekly") as Segment) ?? "weekly";
  const scheduledIso = String(formData.get("scheduledFor") ?? "");
  const scheduledFor = scheduledIso ? new Date(scheduledIso).getTime() : null;

  updateCampaign(id, {
    subject,
    preheader,
    personalNote: personalNote || null,
    bodySnapshot,
    segment,
    scheduledFor,
  });
  revalidatePath(`/admin/campaigns/${id}`);
}

export async function scheduleCampaign(id: string) {
  await requireOwner();
  const c = findCampaign(id);
  if (!c || !c.scheduledFor) return;
  updateCampaign(id, { status: "scheduled" });
  revalidatePath(`/admin/campaigns/${id}`);
  revalidatePath("/admin/campaigns");
}

export async function sendCampaignNow(id: string) {
  await requireOwner();
  await sendCampaignById(id);
  revalidatePath(`/admin/campaigns/${id}`);
  revalidatePath("/admin/campaigns");
}

export async function sendTestEmail(id: string, to: string) {
  await requireOwner();
  const c = findCampaign(id);
  if (!c) return;
  const url = `${env.BETTER_AUTH_URL}/${c.postType === "musing" ? "musings" : "shorts"}/${c.postSlug}`;
  const post = c.postType === "musing" ? findMusing(c.postSlug) : findShort(c.postSlug);
  const number = post?.number ?? 0;
  await sendEssayEmail(to, {
    subject: `[test] ${c.subject}`,
    preheader: c.preheader,
    personalNote: c.personalNote,
    bodyHtml: c.bodySnapshot,
    kind: c.postType,
    number,
    publicUrl: url,
    unsubscribeUrl: `${env.BETTER_AUTH_URL}/api/unsubscribe?token=test`,
  });
}

/**
 * Renders the campaign as HTML for the preview iframe. Same template the
 * subscribers will receive, with a placeholder unsubscribe link.
 */
export async function renderCampaignPreview(id: string): Promise<string> {
  await requireOwner();
  const c = findCampaign(id);
  if (!c) return "<p>not found</p>";
  const post = c.postType === "musing" ? findMusing(c.postSlug) : findShort(c.postSlug);
  const publicUrl = `${env.BETTER_AUTH_URL}/${c.postType === "musing" ? "musings" : "shorts"}/${c.postSlug}`;
  return render(
    EssayEmail({
      subject: c.subject,
      preheader: c.preheader,
      personalNote: c.personalNote,
      bodyHtml: c.bodySnapshot,
      kind: c.postType,
      number: post?.number ?? 0,
      publicUrl,
      unsubscribeUrl: `${env.BETTER_AUTH_URL}/api/unsubscribe?token=preview`,
    }),
  );
}

/** Sends the campaign to every active subscriber in its segment. */
export async function sendCampaignById(
  id: string,
): Promise<{ sent: number; failed: number }> {
  const c = findCampaign(id);
  if (!c) return { sent: 0, failed: 0 };
  if (c.status === "sending" || c.status === "sent")
    return { sent: c.sentCount, failed: 0 };

  updateCampaign(id, { status: "sending" });
  const recipients = listActiveBySegment(c.segment);
  const post = c.postType === "musing" ? findMusing(c.postSlug) : findShort(c.postSlug);
  const publicUrl = `${env.BETTER_AUTH_URL}/${c.postType === "musing" ? "musings" : "shorts"}/${c.postSlug}`;
  const number = post?.number ?? 0;

  let sent = 0;
  let failed = 0;
  for (const sub of recipients) {
    const unsubscribeUrl = `${env.BETTER_AUTH_URL}/api/unsubscribe?token=${sub.unsubscribeToken}`;
    try {
      await sendEssayEmail(sub.email, {
        subject: c.subject,
        preheader: c.preheader,
        personalNote: c.personalNote,
        bodyHtml: c.bodySnapshot,
        kind: c.postType,
        number,
        publicUrl,
        unsubscribeUrl,
      });
      logEvent({
        subscriberId: sub.id,
        campaignId: c.id,
        kind: "sent",
      });
      sent++;
    } catch (err) {
      logEvent({
        subscriberId: sub.id,
        campaignId: c.id,
        kind: "bounced",
        meta: { error: String(err) },
      });
      failed++;
    }
  }
  markCampaignSent(c.id, sent, failed);
  return { sent, failed };
}

/** Lists published posts the writer can pick to start a campaign. */
export async function listPickablePosts() {
  await requireOwner();
  const musings = getAllMusings()
    .filter((m) => m.status === "published")
    .map((m) => ({
      type: "musing" as const,
      slug: m.slug,
      title: m.title,
      number: m.number,
    }));
  const shorts = getAllShorts()
    .filter((s) => s.status === "published")
    .map((s) => ({
      type: "short" as const,
      slug: s.slug,
      title: s.title,
      number: s.number,
    }));
  return [...musings, ...shorts];
}
