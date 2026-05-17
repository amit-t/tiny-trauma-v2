import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check your inbox",
  robots: { index: false, follow: false },
};

export default async function CheckInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

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
          check your inbox.
        </h1>
        <p className="t-body" style={{ color: "var(--ink-2)" }}>
          a link is on its way
          {email ? (
            <>
              {" "}
              to <em>{email}</em>
            </>
          ) : null}
          . it&apos;s good for <em>15 minutes</em>, mostly because it should be.
        </p>
        <p className="t-small" style={{ color: "var(--ink-3)" }}>
          didn&apos;t arrive? check spam, then{" "}
          <Link href="/sign-in" style={{ borderBottom: "1px solid currentColor" }}>
            try again
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
