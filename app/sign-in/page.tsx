import { Wordmark } from "@/components/ui/wordmark";
import { SignInForm } from "./sign-in-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: "48px 24px",
        textAlign: "left",
      }}
    >
      <Wordmark size="nav" />

      <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        <h1 className="t-h3" style={{ color: "var(--ink)" }}>
          come in, <em style={{ color: "var(--accent)" }}>writer.</em>
        </h1>
        <p className="t-small" style={{ color: "var(--ink-2)" }}>
          no passwords. drop your email; I&apos;ll send a link.
        </p>
      </div>

      <SignInForm />

      <p className="t-caption" style={{ color: "var(--ink-3)", maxWidth: 360 }}>
        this is a one-person blog. the link only works for the owner&apos;s email.
      </p>
    </main>
  );
}
