"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ paddingTop: 8 }}>
      <h1>
        something broke. <em>it&apos;s me, not you.</em>
      </h1>
      <p className="admin-sub" style={{ maxWidth: "52ch" }}>
        the workshop tripped over a small thing. try again, or{" "}
        <a
          href="mailto:hi@tinytrauma.in"
          style={{ color: "var(--accent)", borderBottom: "1px solid currentColor" }}
        >
          email me
        </a>{" "}
        and I&apos;ll fix it by hand.
      </p>
      <div style={{ marginTop: 16 }}>
        <Button onClick={() => reset()}>try again</Button>
      </div>
      {error.digest && (
        <p
          className="admin-sub"
          style={{ fontSize: 12, marginTop: 24, color: "var(--ink-4)" }}
        >
          ref: {error.digest}
        </p>
      )}
    </div>
  );
}
