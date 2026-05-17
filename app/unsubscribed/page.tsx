import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribed",
  robots: { index: false, follow: false },
};

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const ok = !error;

  return (
    <SiteShell>
      <section className="page-intro">
        <div className="kicker">
          <span>unsubscribe · {ok ? "done" : "noted"}</span>
        </div>
        {ok ? (
          <>
            <h1>
              you&apos;re <em>off the list.</em>
            </h1>
            <p className="lede">
              no hard feelings. if you ever come back,{" "}
              <span className="hand-inline">the door is always open</span> at{" "}
              <Link href="/newsletter" style={{ borderBottom: "1px solid currentColor" }}>
                /newsletter
              </Link>
              . the essays will keep going up on the site either way.
            </p>
          </>
        ) : (
          <>
            <h1>
              this link <em>doesn&apos;t match anything.</em>
            </h1>
            <p className="lede">
              probably already unsubscribed, or the token is stale. if you keep getting
              mail you didn&apos;t ask for,{" "}
              <a
                href="mailto:hi@tinytrauma.in"
                style={{ borderBottom: "1px solid currentColor" }}
              >
                email me
              </a>{" "}
              and I&apos;ll fix it by hand.
            </p>
          </>
        )}
      </section>
    </SiteShell>
  );
}
