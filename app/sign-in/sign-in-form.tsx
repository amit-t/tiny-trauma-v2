"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestSignInLink, type SignInState } from "./actions";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(
    requestSignInLink,
    null,
  );

  return (
    <form action={action} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
      <Input
        type="email"
        name="email"
        placeholder="you@somewhere.com"
        autoComplete="email"
        required
        aria-invalid={state?.ok === false || undefined}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "sending…" : "send me a link"}
      </Button>
      {state?.ok === false && (
        <p
          role="alert"
          style={{
            color: "var(--accent)",
            fontSize: 13,
            fontStyle: "italic",
            margin: 0,
          }}
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
