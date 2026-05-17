export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1
        className="lowercase"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "clamp(56px, 12vw, 144px)",
          lineHeight: 0.92,
          letterSpacing: "-0.045em",
        }}
      >
        tiny{" "}
        <i style={{ color: "var(--accent)", fontStyle: "italic", fontWeight: 700 }}>
          trauma
        </i>
      </h1>

      <p
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "22px",
          lineHeight: 1.5,
          color: "var(--ink-2)",
          maxWidth: "36ch",
        }}
      >
        <em>the application is being built. one phase at a time.</em>
      </p>

      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12.5px",
          letterSpacing: "0.04em",
          color: "var(--ink-3)",
        }}
      >
        phase 0 · bootstrap
      </p>
    </main>
  );
}
