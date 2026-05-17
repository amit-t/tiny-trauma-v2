import Link from "next/link";
import { listCampaigns, listDueScheduledCampaigns } from "@/lib/campaigns";
import { SendDueButton } from "./send-due-button";

export const dynamic = "force-dynamic";

export default function AdminCampaignsPage() {
  const all = listCampaigns();
  const due = listDueScheduledCampaigns();

  return (
    <div>
      <h1>Campaigns</h1>
      <p className="admin-sub">scheduled and sent newsletters.</p>

      <div className="admin-posts-filters" style={{ justifyContent: "space-between" }}>
        <Link href="/admin/campaigns/new" className="btn btn-sm">
          new campaign →
        </Link>
        <SendDueButton dueCount={due.length} />
      </div>

      {all.length === 0 ? (
        <div className="admin-empty">
          no campaigns. you have to publish something first, then{" "}
          <Link href="/admin/campaigns/new">start one</Link>.
        </div>
      ) : (
        <table className="admin-table admin-posts-table">
          <thead>
            <tr>
              <th>subject</th>
              <th>post</th>
              <th>segment</th>
              <th>status</th>
              <th>scheduled</th>
              <th>sent</th>
              <th>opens</th>
            </tr>
          </thead>
          <tbody>
            {all.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/campaigns/${c.id}`}>
                    {c.subject || "(untitled)"}
                  </Link>
                </td>
                <td>
                  <code className="admin-path">
                    {c.postType}/{c.postSlug}
                  </code>
                </td>
                <td>
                  <span className="chip sl">{c.segment}</span>
                </td>
                <td>
                  <span className={`chip ${statusChip(c.status)}`}>{c.status}</span>
                </td>
                <td>{c.scheduledFor ? formatDateTime(c.scheduledFor) : "—"}</td>
                <td>{c.status === "sent" ? c.sentCount : "—"}</td>
                <td>{c.openCount || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function statusChip(s: string): string {
  switch (s) {
    case "sent":
      return "s";
    case "sending":
      return "b";
    case "scheduled":
      return "sl";
    case "failed":
      return "p";
    default:
      return "l";
  }
}

function formatDateTime(ms: number): string {
  return new Date(ms)
    .toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .toLowerCase();
}
