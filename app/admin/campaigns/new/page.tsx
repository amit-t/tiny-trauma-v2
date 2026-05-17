import { createCampaignFromPost, listPickablePosts } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; type?: string }>;
}) {
  const params = await searchParams;
  const posts = await listPickablePosts();
  const defaultSlug = params.slug ?? posts[0]?.slug ?? "";
  const defaultType = params.type ?? posts[0]?.type ?? "musing";

  return (
    <div>
      <h1>
        Start a <em>campaign.</em>
      </h1>
      <p className="admin-sub">
        pick a published post; the body is snapshotted so later edits to the MDX
        don&apos;t change a sent campaign.
      </p>

      <form
        action={createCampaignFromPost}
        style={{ display: "grid", gap: 16, maxWidth: 540, marginTop: 24 }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span className="admin-sub" style={{ margin: 0 }}>
            post
          </span>
          <select name="slug" defaultValue={defaultSlug} className="input" required>
            {posts.map((p) => (
              <option key={`${p.type}/${p.slug}`} value={p.slug}>
                {p.type === "musing" ? "musing" : "short"} · № {p.number} · {p.title}
              </option>
            ))}
          </select>
        </label>
        <input type="hidden" name="type" value={defaultType} />
        <button type="submit" className="btn">
          create campaign →
        </button>
      </form>

      <p className="admin-sub" style={{ marginTop: 24 }}>
        the <em>type</em> is inferred from the slug — only published posts appear in the
        list above.
      </p>
    </div>
  );
}
