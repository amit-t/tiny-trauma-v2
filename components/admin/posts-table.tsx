"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type PostRow = {
  type: "musing" | "short";
  number: number;
  title: string;
  slug: string;
  status: "draft" | "published";
  publishedAt: string;
  tags: string[];
  path: string;
};

type StatusFilter = "all" | "draft" | "published";
type TypeFilter = "all" | "musing" | "short";

export function PostsTable({ rows }: { rows: PostRow[] }) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (type !== "all" && r.type !== type) return false;
      if (needle) {
        const hay = `${r.title} ${r.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, status, type, q]);

  return (
    <div>
      <div className="admin-posts-filters">
        <input
          type="search"
          placeholder="search title or tag…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="admin-search"
        />
        <Pill on={status === "all"} onClick={() => setStatus("all")}>
          all
        </Pill>
        <Pill on={status === "published"} onClick={() => setStatus("published")}>
          published
        </Pill>
        <Pill on={status === "draft"} onClick={() => setStatus("draft")}>
          drafts
        </Pill>
        <span className="admin-pill-sep" aria-hidden>
          ·
        </span>
        <Pill on={type === "all"} onClick={() => setType("all")}>
          both types
        </Pill>
        <Pill on={type === "musing"} onClick={() => setType("musing")}>
          musings
        </Pill>
        <Pill on={type === "short"} onClick={() => setType("short")}>
          shorts
        </Pill>
        <span className="admin-pill-sep" aria-hidden>
          ·
        </span>
        <span className="admin-count">{filtered.length} shown</span>
      </div>

      <table className="admin-table admin-posts-table">
        <thead>
          <tr>
            <th>no.</th>
            <th>title</th>
            <th>type</th>
            <th>status</th>
            <th>published</th>
            <th>tags</th>
            <th>file</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td className="empty" colSpan={7}>
                no posts match this filter. probably for the best.
              </td>
            </tr>
          ) : (
            filtered.map((r) => (
              <tr key={`${r.type}/${r.slug}`}>
                <td className="admin-num">{r.number}</td>
                <td>
                  <Link
                    href={`/admin/posts/${r.type}/${r.slug}`}
                    dangerouslySetInnerHTML={{ __html: italicize(r.title) }}
                  />
                </td>
                <td>
                  <span className={`chip ${r.type === "musing" ? "l" : "b"}`}>
                    {r.type}
                  </span>
                </td>
                <td>
                  <span className={`chip ${r.status === "published" ? "s" : "p"}`}>
                    {r.status}
                  </span>
                </td>
                <td>{r.publishedAt}</td>
                <td className="admin-tags">
                  {r.tags.length === 0 ? (
                    <span style={{ color: "var(--ink-4)" }}>—</span>
                  ) : (
                    r.tags.map((t) => (
                      <span key={t} className="chip sl admin-tag-chip">
                        {t}
                      </span>
                    ))
                  )}
                </td>
                <td>
                  <code className="admin-path">{r.path}.mdx</code>
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
    <button
      type="button"
      onClick={onClick}
      className={on ? "filter active" : "filter"}
    >
      {children}
    </button>
  );
}

/** `*foo*` → `<em>foo</em>` for table cells. */
function italicize(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
