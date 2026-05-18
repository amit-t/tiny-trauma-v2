export default function AdminCrossPostPage() {
  return (
    <div>
      <h1>
        Cross-post <em>· later.</em>
      </h1>
      <p className="admin-sub">
        platform-shaped variants for twitter, linkedin, instagram captions.
      </p>

      <div className="admin-empty">
        not on the deployed admin yet. cross-post generation lives in the{" "}
        <em>tiny-trauma-content</em> writing skill — it reads the MDX file locally, runs
        Claude, and prints variants you can paste. no DB writes, no API keys, no surface
        here to maintain.
      </div>
    </div>
  );
}
