import "server-only";

import { appDb, nowMs } from "./app-db";
import { newId } from "./tokens";

export type EventKind =
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained";

export function logEvent(input: {
  subscriberId: string | null;
  campaignId: string | null;
  kind: EventKind;
  meta?: Record<string, unknown>;
}): void {
  appDb
    .prepare(
      `INSERT INTO subscribe_events (id, subscriber_id, campaign_id, kind, meta, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      newId(),
      input.subscriberId,
      input.campaignId,
      input.kind,
      input.meta ? JSON.stringify(input.meta) : null,
      nowMs(),
    );
}
