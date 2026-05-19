import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { confirmSubscriber, findByToken } from "@/lib/subscribers";
import { getPublishedMusings } from "@/lib/posts";
import { sendWelcomeEmail } from "@/lib/mailer";
import { logEvent } from "@/lib/events";
import { env } from "@/lib/env";
import { renderInline } from "@/lib/render-prose";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmed",
  robots: { index: false, follow: false },
};

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <Result kind="missing" />;
  }

  const sub = await findByToken(token);
  if (!sub) {
    return <Result kind="unknown" />;
  }

  // First-time confirmation triggers the welcome email; idempotent on
  // double-clicks (we only confirm if status was pending).
  const wasPending = sub.status === "pending";
  if (wasPending) {
    await confirmSubscriber(sub.id);
    const starters = getPublishedMusings()
      .slice(0, 3)
      .map((m) => ({
        url: `${env.BETTER_AUTH_URL}/musings/${m.slug}`,
        title: stripMarkers(m.title),
      }));
    const unsubscribeUrl = `${env.BETTER_AUTH_URL}/api/unsubscribe?token=${sub.unsubscribeToken}`;
    try {
      await sendWelcomeEmail(sub.email, { starterEssays: starters, unsubscribeUrl });
      await logEvent({
        subscriberId: sub.id,
        campaignId: null,
        kind: "delivered",
        meta: { stage: "welcome-send" },
      });
    } catch (err) {
      await logEvent({
        subscriberId: sub.id,
        campaignId: null,
        kind: "bounced",
        meta: { error: String(err), stage: "welcome-send" },
      });
    }
  }

  return <Result kind="ok" />;
}

function Result({ kind }: { kind: "ok" | "missing" | "unknown" }) {
  const starters = getPublishedMusings().slice(0, 3);
  const hasStarters = starters.length > 0;
  return (
    <SiteShell>
      <section className="page-intro">
        <div className="kicker">
          <span>subscription · {kind === "ok" ? "confirmed" : "error"}</span>
        </div>
        {kind === "ok" ? (
          <>
            <h1>
              you&apos;re <em>on the list.</em>
            </h1>
            <p className="lede">
              the next sunday letter will find you.
              {hasStarters && (
                <>
                  {" "}
                  <span className="hand-inline">
                    in the meantime, three essays to start with:
                  </span>
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <h1>
              this link <em>doesn&apos;t work.</em>
            </h1>
            <p className="lede">
              {kind === "missing"
                ? "no token in the URL."
                : "the link is either old or never existed."}{" "}
              try{" "}
              <Link href="/newsletter" style={{ borderBottom: "1px solid currentColor" }}>
                subscribing again
              </Link>
              ; it&apos;s no trouble.
            </p>
          </>
        )}
      </section>

      {kind === "ok" && hasStarters && (
        <ul
          style={{
            display: "grid",
            gap: 10,
            listStyle: "none",
            padding: 0,
            margin: "0 0 64px",
          }}
        >
          {starters.map((m) => (
            <li key={m.slug}>
              ↳{" "}
              <Link
                href={`/musings/${m.slug}`}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  color: "var(--ink)",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 2,
                }}
              >
                {renderInline(m.title)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SiteShell>
  );
}

function stripMarkers(s: string): string {
  return s
    .replace(/\*/g, "")
    .replace(/==/g, "")
    .replace(/\[\[|\]\]/g, "");
}
