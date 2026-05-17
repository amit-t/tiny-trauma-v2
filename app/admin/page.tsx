export default function AdminDashboardPage() {
  return (
    <div>
      <h1>
        tiny trauma · <em>workshop.</em>
      </h1>
      <p className="admin-sub">
        a quiet desk for one writer. no team, no permissions, no metrics theatre.
      </p>

      <section className="admin-stats" aria-label="At-a-glance">
        <Stat label="drafts" />
        <Stat label="scheduled" />
        <Stat label="subscribers" />
        <Stat label="last sent" />
      </section>

      <div className="admin-empty">
        nothing yet, which is — <em>mostly</em> — the right state for a Sunday morning.
        start a new draft from <em>posts</em>, or pull a half-formed idea out of{" "}
        <em>brainstorm</em>.
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
