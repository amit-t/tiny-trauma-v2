export function DraftPill() {
  return (
    <span
      className="chip b"
      style={{ fontWeight: 500, letterSpacing: "0.04em" }}
      aria-label="draft (only visible in dev)"
    >
      draft
    </span>
  );
}
