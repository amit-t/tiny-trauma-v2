import "server-only";

import { db } from "./db";
import { subscribeEvents } from "@/db/schema";
import { newId } from "./tokens";

export type EventKind =
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained";

export async function logEvent(input: {
  subscriberId: string | null;
  campaignId: string | null;
  kind: EventKind;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(subscribeEvents).values({
    id: newId(),
    subscriberId: input.subscriberId,
    campaignId: input.campaignId,
    kind: input.kind,
    meta: input.meta ?? null,
    createdAt: new Date(),
  });
}
