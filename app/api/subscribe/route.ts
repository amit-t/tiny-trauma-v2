import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { createOrRefreshSubscriber } from "@/lib/subscribers";
import { sendConfirmSubscriptionEmail } from "@/lib/mailer";
import { logEvent } from "@/lib/events";

const BodySchema = z.object({
  email: z.string().email("that doesn't look like a full email address yet."),
  firstName: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  tier: z.enum(["weekly", "monthly", "both"]).default("weekly"),
  source: z
    .enum(["home", "about", "newsletter", "footer", "manual"])
    .default("newsletter"),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json." }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "invalid input.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const { subscriber, shouldSendConfirm } = createOrRefreshSubscriber({
    email: parsed.data.email,
    firstName: parsed.data.firstName,
    tier: parsed.data.tier,
    source: parsed.data.source,
  });

  if (shouldSendConfirm) {
    const confirmUrl = `${env.BETTER_AUTH_URL}/subscribe/confirm?token=${subscriber.unsubscribeToken}`;
    const unsubscribeUrl = `${env.BETTER_AUTH_URL}/api/unsubscribe?token=${subscriber.unsubscribeToken}`;
    try {
      await sendConfirmSubscriptionEmail(subscriber.email, {
        confirmUrl,
        unsubscribeUrl,
      });
    } catch (err) {
      // Don't 500 the user — they can re-submit. Log the failure as an event
      // so /admin can see the attempt.
      logEvent({
        subscriberId: subscriber.id,
        campaignId: null,
        kind: "bounced",
        meta: { error: String(err), stage: "confirm-send" },
      });
    }
  }

  return NextResponse.json({ ok: true, status: subscriber.status });
}
