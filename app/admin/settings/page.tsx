// Read-only env presence — values are never displayed.

const ENV_KEYS = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "RESEND_REPLY_TO",
  "RESEND_WEBHOOK_SECRET",
  "CRON_SECRET",
  "OWNER_EMAIL",
] as const;

export default function AdminSettingsPage() {
  const rows = ENV_KEYS.map((k) => ({ key: k, set: Boolean(process.env[k]) }));

  return (
    <div>
      <h1>Settings</h1>
      <p className="admin-sub">env presence only — values are never shown.</p>

      <dl className="admin-env-grid">
        {rows.map((r) => (
          <Row key={r.key} k={r.key} set={r.set} />
        ))}
      </dl>
    </div>
  );
}

function Row({ k, set }: { k: string; set: boolean }) {
  return (
    <>
      <dt>{k}</dt>
      <dd className={set ? "set" : "unset"}>{set ? "set" : "unset"}</dd>
    </>
  );
}
