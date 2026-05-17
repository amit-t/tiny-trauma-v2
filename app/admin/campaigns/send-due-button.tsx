"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendDueScheduledCampaigns } from "./send-due-action";

export function SendDueButton({ dueCount }: { dueCount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await sendDueScheduledCampaigns();
      window.alert(
        res.processed === 0
          ? "nothing due. quiet morning."
          : `processed ${res.processed} campaign(s). sent: ${res.sent}, failed: ${res.failed}.`,
      );
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className={dueCount > 0 ? "btn btn-sm" : "btn btn-sm btn-secondary"}
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? "sending…" : `send due now${dueCount > 0 ? ` (${dueCount})` : ""}`}
    </button>
  );
}
