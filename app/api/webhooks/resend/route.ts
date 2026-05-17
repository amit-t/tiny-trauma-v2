// Resend webhook ingest.
//
// Configure in Resend dashboard → Webhooks:
//   URL: https://tinytrauma.in/api/webhooks/resend
//   Events: email.delivered, email.opened, email.clicked,
//           email.bounced, email.complained
//   Signing secret: paste into env as RESEND_WEBHOOK_SECRET.
//
// Resend signs payloads with Svix. We verify, then insert a subscribe_event
// row keyed by recipient email and flip status on hard bounces / complaints.

import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { env } from "@/lib/env";
import { findByEmail, markBounced, markComplained } from "@/lib/subscribers";
import { logEvent } from "@/lib/events";
import { incrementCampaignCounter } from "@/lib/campaigns";

type ResendEvent = {
  type:
    | "email.delivered"
    | "email.opened"
    | "email.clicked"
    | "email.bounced"
    | "email.complained";
  created_at: string;
  data?: {
    email_id?: string;
    to?: string[];
    subject?: string;
    bounce_type?: "hard" | "soft" | "general";
    tags?: { name?: string; value?: string }[];
  };
};

export async function POST(req: Request) {
  const secret = env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "RESEND_WEBHOOK_SECRET not configured" },
      { status: 503 },
    );
  }

  const body = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let evt: ResendEvent;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(body, headers) as ResendEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 400 });
  }

  const to = evt.data?.to?.[0] ?? null;
  const sub = to ? findByEmail(to) : null;
  const subscriberId = sub?.id ?? null;

  // Campaign id is embedded as a Resend tag when we send below; falls back to
  // null when not present (e.g. magic-link / confirm emails).
  const campaignId = evt.data?.tags?.find((t) => t.name === "campaign_id")?.value ?? null;

  switch (evt.type) {
    case "email.delivered":
      logEvent({ subscriberId, campaignId, kind: "delivered" });
      break;
    case "email.opened":
      logEvent({ subscriberId, campaignId, kind: "opened" });
      if (campaignId) incrementCampaignCounter(campaignId, "open_count");
      break;
    case "email.clicked":
      logEvent({ subscriberId, campaignId, kind: "clicked" });
      if (campaignId) incrementCampaignCounter(campaignId, "click_count");
      break;
    case "email.bounced":
      logEvent({
        subscriberId,
        campaignId,
        kind: "bounced",
        meta: { bounceType: evt.data?.bounce_type },
      });
      if (to && evt.data?.bounce_type === "hard") markBounced(to);
      break;
    case "email.complained":
      logEvent({ subscriberId, campaignId, kind: "complained" });
      if (to) markComplained(to);
      break;
  }

  return NextResponse.json({ ok: true });
}
