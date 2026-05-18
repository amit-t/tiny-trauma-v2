"use client";

import { useMemo, useState, useTransition } from "react";
import {
  deleteSubscriberAction,
  exportSubscribersCsv,
  unsubscribeSubscriber,
} from "@/app/admin/subscribers/actions";

export type SubscriberRow = {
  id: string;
  email: string;
  firstName: string | null;
  tier: "weekly" | "monthly" | "both";
  status: "pending" | "active" | "unsubscribed" | "bounced" | "complained";
  source: string | null;
  createdAt: string; // ISO
};

type StatusFilter = "all" | SubscriberRow["status"];
type TierFilter = "all" | SubscriberRow["tier"];

export function SubscribersTable({ rows }: { rows: SubscriberRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tier, setTier] = useState<TierFilter>("all");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (tier !== "all" && r.tier !== tier) return false;
      if (needle && !r.email.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [rows, q, status, tier]);

  async function handleExport() {
    const csv = await exportSubscribersCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tiny-trauma-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleCopy(email: string) {
    void navigator.clipboard.writeText(email);
  }

  function handleUnsubscribe(id: string) {
    startTransition(async () => {
      await unsubscribeSubscriber(id);
    });
  }

  function handleDelete(id: string, email: string) {
    if (!window.confirm(`delete ${email}? not coming back.`)) return;
    startTransition(async () => {
      await deleteSubscriberAction(id);
    });
  }

  return (
    <div>
      <div className="admin-posts-filters">
        <input
          type="search"
          placeholder="search email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-search"
        />
        <Pill on={status === "all"} onClick={() => setStatus("all")}>
          all status
        </Pill>
        {(["active", "pending", "unsubscribed", "bounced", "complained"] as const).map(
          (s) => (
            <Pill key={s} on={status === s} onClick={() => setStatus(s)}>
              {s}
            </Pill>
          ),
        )}
        <span className="admin-pill-sep" aria-hidden>
          ·
        </span>
        <Pill on={tier === "all"} onClick={() => setTier("all")}>
          all tiers
        </Pill>
        {(["weekly", "monthly", "both"] as const).map((t) => (
          <Pill key={t} on={tier === t} onClick={() => setTier(t)}>
            {t}
          </Pill>
        ))}
        <span className="admin-count">{filtered.length} shown</span>
        <button type="button" className="btn btn-sm btn-secondary" onClick={handleExport}>
          export CSV ↓
        </button>
      </div>

      <table className="admin-table admin-posts-table">
        <thead>
          <tr>
            <th>email</th>
            <th>name</th>
            <th>tier</th>
            <th>status</th>
            <th>source</th>
            <th>joined</th>
            <th>actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td className="empty" colSpan={7}>
                no subscribers match this filter. probably for the best.
              </td>
            </tr>
          ) : (
            filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.email}</td>
                <td>{r.firstName ?? <span style={{ color: "var(--ink-4)" }}>—</span>}</td>
                <td>
                  <span className="chip sl">{r.tier}</span>
                </td>
                <td>
                  <span className={`chip ${statusChip(r.status)}`}>{r.status}</span>
                </td>
                <td>{r.source ?? "—"}</td>
                <td>{formatDate(r.createdAt)}</td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="admin-link"
                      onClick={() => handleCopy(r.email)}
                    >
                      copy
                    </button>
                    {r.status !== "unsubscribed" && (
                      <button
                        type="button"
                        className="admin-link"
                        onClick={() => handleUnsubscribe(r.id)}
                        disabled={pending}
                      >
                        unsubscribe
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-link admin-link-danger"
                      onClick={() => handleDelete(r.id, r.email)}
                      disabled={pending}
                    >
                      delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Pill({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={on ? "active filter" : "filter"}>
      {children}
    </button>
  );
}

function statusChip(s: SubscriberRow["status"]): string {
  switch (s) {
    case "active":
      return "s";
    case "pending":
      return "b";
    case "unsubscribed":
      return "l";
    case "bounced":
    case "complained":
      return "p";
  }
}

function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
    .toLowerCase();
}
