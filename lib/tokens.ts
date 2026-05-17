import { randomBytes } from "node:crypto";

/** 32 hex chars (16 bytes of entropy) — used for unsubscribe + confirm. */
export function newToken(): string {
  return randomBytes(16).toString("hex");
}

/** 22-char URL-safe id, base64-ish. Used as primary key for app rows. */
export function newId(): string {
  return randomBytes(16).toString("base64url");
}
