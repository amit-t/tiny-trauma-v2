"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/layout/site-shell";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in server logs / monitoring later.
    console.error(error);
  }, [error]);

  return (
    <SiteShell>
      <section className="page-intro">
        <div className="kicker">
          <span>error · 500</span>
        </div>
        <h1>
          Something broke. <em>it&apos;s me, not you.</em>
        </h1>
        <p className="lede">
          Try again, or come back in a minute — I&apos;m probably restarting something I
          shouldn&apos;t have.
        </p>
        <div style={{ marginTop: 24 }}>
          <Button onClick={() => reset()}>try again</Button>
        </div>
      </section>
    </SiteShell>
  );
}
