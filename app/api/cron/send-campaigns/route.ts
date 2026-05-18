// Send all `scheduled` campaigns whose `scheduledFor` is in the past.
//
// Auth: `Authorization: Bearer ${CRON_SECRET}`.
//
// Triggered by a GitHub Actions workflow every 5 minutes:
//   .github/workflows/cron-send.yml  (lands in phase 6 / deploy)
//   on:
//     schedule: [{ cron: "*/5 * * * *" }]
//   jobs:
//     send:
//       runs-on: ubuntu-latest
//       steps:
//         - run: |
//             curl -fsS -X POST -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
//                  "${{ secrets.SITE_URL }}/api/cron/send-campaigns"
//
// Local: there's a "send due now" button on /admin/campaigns that calls the
// same code path via a server action (skips the HTTP/secret hop).

import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { listDueScheduledCampaigns } from "@/lib/campaigns";
import { sendCampaignById } from "@/app/admin/campaigns/actions";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;
  if (auth !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const due = await listDueScheduledCampaigns();
  let sent = 0;
  let failed = 0;
  for (const c of due) {
    const r = await sendCampaignById(c.id);
    sent += r.sent;
    failed += r.failed;
  }

  return NextResponse.json({
    ok: true,
    processed: due.length,
    sent,
    failed,
  });
}
