"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SubscribeSource = "home" | "about" | "newsletter" | "footer";
export type SubscribeVariant = "band" | "side" | "card" | "mini";

type Tier = "weekly" | "monthly" | "both";

export function SubscribeForm({
  variant,
  source,
}: {
  variant: SubscribeVariant;
  source: SubscribeSource;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [tier, setTier] = useState<Tier>("weekly");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, tier, source }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "couldn't send the link. try again in a minute.");
      } else {
        setDone(true);
      }
    } catch {
      setError("network said no. try again.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return <Success variant={variant} />;
  }

  const showName = variant === "band" || variant === "card";
  const showTiers = variant === "card";
  const compact = variant === "side" || variant === "mini";

  return (
    <form onSubmit={handleSubmit}>
      {showName ? (
        <div
          className="row"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <Input
            type="text"
            name="firstName"
            placeholder="first name"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            type="email"
            name="email"
            placeholder="you@somewhere.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      ) : (
        <div style={compact ? { display: "flex", gap: 8, flexWrap: "wrap" } : undefined}>
          <Input
            type="email"
            name="email"
            placeholder="you@somewhere.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={compact ? { flex: "1 1 200px" } : undefined}
          />
          {compact && (
            <Button type="submit" disabled={pending}>
              {pending ? "sending…" : "subscribe →"}
            </Button>
          )}
        </div>
      )}

      {showTiers && (
        <div className="tiers" style={{ marginTop: 4 }}>
          {(["weekly", "monthly", "both"] as Tier[]).map((t) => (
            <button
              type="button"
              key={t}
              className={tier === t ? "tier-pick on" : "tier-pick"}
              onClick={() => setTier(t)}
              aria-pressed={tier === t}
            >
              {t} · free
            </button>
          ))}
        </div>
      )}

      {!compact && (
        <div style={{ marginTop: showTiers ? 8 : 12 }}>
          <Button type="submit" disabled={pending}>
            {pending ? "sending…" : "subscribe →"}
          </Button>
        </div>
      )}

      {variant !== "mini" && (
        <p
          className="small"
          style={{ color: "var(--ink-3)", fontSize: 12.5, marginTop: 8 }}
        >
          no spam. unsubscribe in one click. I read every reply, even the angry ones.
        </p>
      )}

      {error && (
        <p
          role="alert"
          style={{
            marginTop: 8,
            color: "var(--accent)",
            fontStyle: "italic",
            fontSize: 13,
          }}
        >
          {error}
        </p>
      )}
    </form>
  );
}

function Success({ variant }: { variant: SubscribeVariant }) {
  const text =
    variant === "card" || variant === "band"
      ? "check your inbox. it's on the way."
      : "check your inbox.";
  return (
    <div
      role="status"
      style={{
        padding: "14px 0",
        color: "var(--ink-2)",
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontSize: 18,
      }}
    >
      ↳ {text}
    </div>
  );
}
