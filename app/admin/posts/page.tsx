import { PostsTable, type PostRow } from "@/components/admin/posts-table";
import { getAllPostsForAdmin } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default function AdminPostsPage() {
  const rows: PostRow[] = getAllPostsForAdmin().map((p) => ({
    type: p.type,
    number: p.number,
    title: p.title,
    slug: p.slug,
    status: p.status,
    publishedAt: p.publishedAt,
    tags: p.tags,
    path: p.path,
  }));

  const counts = {
    total: rows.length,
    published: rows.filter((r) => r.status === "published").length,
    draft: rows.filter((r) => r.status === "draft").length,
  };

  return (
    <div>
      <h1>Posts</h1>
      <p className="admin-sub">
        read-only window into <code>content/</code>. edit happens in your editor; publish
        happens on commit.
      </p>

      <div className="admin-posts-summary">
        <span>
          <strong>{counts.total}</strong> total
        </span>
        <span className="sep" aria-hidden>
          ·
        </span>
        <span>{counts.published} published</span>
        <span className="sep" aria-hidden>
          ·
        </span>
        <span>{counts.draft} draft</span>
      </div>

      <PostsTable rows={rows} />
    </div>
  );
}
