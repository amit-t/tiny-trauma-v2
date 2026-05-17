"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { isOwnerEmail, normalizeEmail } from "@/lib/auth-helpers";

export type SignInState = { ok: false; error: string } | null;

export async function requestSignInLink(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const raw = String(formData.get("email") ?? "");
  const email = normalizeEmail(raw);

  if (!email || !email.includes("@")) {
    return { ok: false, error: "that doesn't look like a full email address yet." };
  }

  if (!isOwnerEmail(email)) {
    redirect("/not-owner");
  }

  // Owner only beyond this point. Trigger the magic link send.
  await auth.api.signInMagicLink({
    body: { email, callbackURL: "/admin" },
    headers: await headers(),
  });

  redirect(`/sign-in/check-inbox?email=${encodeURIComponent(email)}`);
}
