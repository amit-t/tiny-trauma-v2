import { countByStatus } from "@/lib/subscribers";
import { listCampaigns } from "@/lib/campaigns";
import { getAllMusings, getAllShorts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [subs, campaigns] = await Promise.all([countByStatus(), listCampaigns()]);
  const drafts =
    getAllMusings().filter((m) => m.status === "draft").length +
    getAllShorts().filter((s) => s.status === "draft").length;
  const scheduled = campaigns.filter((c) => c.status === "scheduled").length;
  const lastSent = campaigns.find((c) => c.status === "sent");
  const lastSentLabel = lastSent?.sentAt
    ? new Date(lastSent.sentAt)
        .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
        .toLowerCase()
    : "—";

  return (
    <div>
      <h1>
        tiny trauma · <em>workshop.</em>
      </h1>
      <p className="admin-sub">
        a quiet desk for one writer. no team, no permissions, no metrics theatre.
      </p>

      <section className="admin-stats" aria-label="At-a-glance">
        <Stat label="drafts" value={fmt(drafts)} />
        <Stat label="scheduled" value={fmt(scheduled)} />
        <Stat
          label="active subscribers"
          value={fmt(subs.active)}
          meta={subs.pending ? `${subs.pending} pending confirm` : undefined}
        />
        <Stat label="last sent" value={lastSentLabel} />
      </section>

      <div className="admin-empty">
        {scheduled === 0 && subs.active === 0
          ? "nothing yet, which is — mostly — the right state for a Sunday morning. start a new draft from the writing skill, or pull a half-formed idea out of brainstorm."
          : "look at that — you have readers and something to send them. probably enough for a Sunday."}
      </div>
    </div>
  );
}

function Stat({
  label,
  value = "—",
  meta,
}: {
  label: string;
  value?: string;
  meta?: string;
}) {
  return (
    <article className="admin-stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {meta && <div className="meta">{meta}</div>}
    </article>
  );
}

function fmt(n: number): string {
  return n === 0 ? "—" : n.toLocaleString();
}
