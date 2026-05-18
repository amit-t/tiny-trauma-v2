import { notFound } from "next/navigation";
import { findCampaign } from "@/lib/campaigns";
import { CampaignEditor } from "./editor";
import {
  renderCampaignPreview,
  saveCampaign,
  scheduleCampaign,
  sendCampaignNow,
  sendTestEmail,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await findCampaign(id);
  if (!c) notFound();

  const previewHtml = await renderCampaignPreview(id);

  return (
    <CampaignEditor
      campaign={{
        id: c.id,
        postSlug: c.postSlug,
        postType: c.postType,
        subject: c.subject,
        preheader: c.preheader,
        personalNote: c.personalNote,
        bodySnapshot: c.bodySnapshot,
        segment: c.segment,
        scheduledFor: c.scheduledFor,
        status: c.status,
        sentAt: c.sentAt,
        sentCount: c.sentCount,
        openCount: c.openCount,
      }}
      previewHtml={previewHtml}
      actions={{
        save: saveCampaign.bind(null, id),
        schedule: scheduleCampaign.bind(null, id),
        sendNow: sendCampaignNow.bind(null, id),
        sendTest: sendTestEmail.bind(null, id),
      }}
    />
  );
}
