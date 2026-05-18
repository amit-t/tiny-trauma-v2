export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        color: "var(--ink-2)",
        fontSize: 18,
        padding: "40px 0",
      }}
    >
      thinking…
    </div>
  );
}
