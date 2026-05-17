"use client";

import { useState } from "react";

export function CopyPathClientButton({ absPath }: { absPath: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(absPath);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore — clipboard isn't available in all environments
    }
  }

  return (
    <button type="button" className="btn btn-sm btn-secondary" onClick={copy}>
      {copied ? "copied." : "copy path"}
    </button>
  );
}
