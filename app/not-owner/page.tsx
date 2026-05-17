import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not the owner",
  robots: { index: false, follow: false },
};

export default function NotOwnerPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "48px 24px",
        textAlign: "left",
      }}
    >
      <Wordmark size="nav" />
      <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <h1 className="t-h3" style={{ color: "var(--ink)" }}>
          this is a <em style={{ color: "var(--accent)" }}>one-person</em> blog.
        </h1>
        <p className="t-body" style={{ color: "var(--ink-2)" }}>
          there&apos;s no account here for you, which is, mostly, the way the internet
          should work. you&apos;re welcome to keep reading{" "}
          <Link href="/musings" style={{ borderBottom: "1px solid currentColor" }}>
            the musings
          </Link>{" "}
          or{" "}
          <Link href="/newsletter" style={{ borderBottom: "1px solid currentColor" }}>
            subscribe
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
