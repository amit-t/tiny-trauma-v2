import { NextResponse } from "next/server";
import { findByToken, unsubscribe } from "@/lib/subscribers";
import { logEvent } from "@/lib/events";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribed?error=missing", url.origin));
  }
  const sub = await findByToken(token);
  if (!sub) {
    return NextResponse.redirect(new URL("/unsubscribed?error=unknown", url.origin));
  }
  await unsubscribe(sub.id);
  await logEvent({
    subscriberId: sub.id,
    campaignId: null,
    kind: "complained",
    meta: { via: "unsubscribe-link" },
  });
  return NextResponse.redirect(new URL("/unsubscribed", url.origin));
}
