import {
  SubscribersTable,
  type SubscriberRow,
} from "@/components/admin/subscribers-table";
import { countByStatus, listAllSubscribers } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  const [list, counts] = await Promise.all([listAllSubscribers(), countByStatus()]);
  const rows: SubscriberRow[] = list.map((s) => ({
    id: s.id,
    email: s.email,
    firstName: s.firstName,
    tier: s.tier,
    status: s.status,
    source: s.source,
    createdAt: new Date(s.createdAt).toISOString(),
  }));
  const total = rows.length;

  return (
    <div>
      <h1>Subscribers</h1>
      <p className="admin-sub">quiet readers; no analytics theatre.</p>

      <div className="admin-posts-summary">
        <span>
          <strong>{total}</strong> total
        </span>
        <span className="sep" aria-hidden>
          ·
        </span>
        <span>{counts.active} active</span>
        <span className="sep" aria-hidden>
          ·
        </span>
        <span>{counts.pending} pending</span>
        <span className="sep" aria-hidden>
          ·
        </span>
        <span>{counts.unsubscribed + counts.bounced + counts.complained} off-list</span>
      </div>

      <SubscribersTable rows={rows} />
    </div>
  );
}
