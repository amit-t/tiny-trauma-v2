import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findMusing, findShort } from "@/lib/posts";

import type { Metadata } from "next";

type Params = { type: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { type, slug } = await params;
  return {
    title: `${type === "short" ? "short" : "musing"} · ${slug}`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminPostDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { type, slug } = await params;
  if (type !== "musing" && type !== "short") notFound();
  const post = type === "musing" ? findMusing(slug) : findShort(slug);
  if (!post) notFound();

  const absPath = path.resolve(process.cwd(), "content", `${post.path}.mdx`);
  const vscodeUrl = `vscode://file${absPath}`;
  const publicUrl = `/${type === "musing" ? "musings" : "shorts"}/${post.slug}`;

  return (
    <div className="admin-post-detail">
      <header className="admin-post-detail-head">
        <div>
          <div className="admin-post-detail-kicker">
            <span className={`chip ${type === "musing" ? "l" : "b"}`}>{type}</span>
            <span className={`chip ${post.status === "published" ? "s" : "p"}`}>
              {post.status}
            </span>
            <span className="admin-sub">№ {post.number}</span>
          </div>
          <h1
            dangerouslySetInnerHTML={{
              __html: italicize(post.title),
            }}
          />
          <p
            className="admin-sub"
            dangerouslySetInnerHTML={{ __html: italicize(post.dek) }}
          />
        </div>
        <div className="admin-post-actions">
          <a
            href={vscodeUrl}
            className="btn btn-sm btn-secondary"
            title="vscode://file… — works for VS Code, Cursor, Windsurf"
          >
            open in editor ↗
          </a>
          <CopyPathButton absPath={absPath} />
          {post.status === "published" && (
            <Link href={publicUrl} className="btn btn-sm btn-ghost">
              view public ↗
            </Link>
          )}
          <Link
            href={`/admin/campaigns/new?slug=${encodeURIComponent(post.slug)}&type=${type}`}
            className="btn btn-sm"
          >
            create campaign →
          </Link>
        </div>
      </header>

      <div className="admin-post-grid">
        <article className={type === "short" ? "short-body" : "prose"}>
          <div dangerouslySetInnerHTML={{ __html: post.body }} />
        </article>
        <aside className="admin-frontmatter">
          <h3>frontmatter</h3>
          <dl className="admin-env-grid">
            <Row k="title" v={post.title} />
            <Row k="dek" v={post.dek} />
            <Row k="type" v={type} />
            <Row k="number" v={String(post.number)} />
            <Row k="status" v={post.status} />
            <Row k="publishedAt" v={post.publishedAt} />
            <Row k="featured" v={String(post.featured)} />
            <Row k="heroTint" v={post.heroTint} />
            <Row k="tags" v={post.tags.length === 0 ? "—" : post.tags.join(", ")} />
            <Row k="wordCount" v={String(post.wordCount)} />
            <Row k="readingTimeMinutes" v={String(post.readingTimeMinutes)} />
            <Row k="path" v={`${post.path}.mdx`} />
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt>{k}</dt>
      <dd className="set" style={{ wordBreak: "break-word" }}>
        {v}
      </dd>
    </>
  );
}

function italicize(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function CopyPathButton({ absPath }: { absPath: string }) {
  return <CopyPathClientButton absPath={absPath} />;
}

// Inline a small client component for the copy button; keeps the page server-rendered.
import { CopyPathClientButton } from "@/components/admin/copy-path-button";
