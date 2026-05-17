import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";
import { env } from "./env";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Server-only. Redirects to /sign-in if no session, /not-owner if signed in
 * as anyone other than env.OWNER_EMAIL. Returns the session otherwise.
 */
export async function requireOwner() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");
  if (normalizeEmail(session.user.email) !== normalizeEmail(env.OWNER_EMAIL)) {
    redirect("/not-owner");
  }
  return session;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isOwnerEmail(email: string): boolean {
  return normalizeEmail(email) === normalizeEmail(env.OWNER_EMAIL);
}
