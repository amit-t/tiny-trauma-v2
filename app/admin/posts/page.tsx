import Link from "next/link";

export default function AdminPostsPage() {
  return (
    <div>
      <h1>Posts</h1>
      <p className="admin-sub">essays and shorts, drafts and published.</p>

      <div className="admin-empty">
        no posts yet. <Link href="/admin/posts/new">start one →</Link>
      </div>
    </div>
  );
}
