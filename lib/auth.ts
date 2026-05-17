import "server-only";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";

import { env } from "./env";
import { sendMagicLinkEmail } from "./mailer";

/**
 * Phase 3: sessions live in a file-backed SQLite, per the prompt. Phase 4
 * will swap this to the Drizzle/Postgres adapter when the real schema lands.
 */
const DB_PATH = "./.data/auth.sqlite";

function openDb(): Database.Database {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export const authDb = openDb();

export const auth = betterAuth({
  database: authDb,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: false },
  plugins: [
    magicLink({
      expiresIn: 60 * 15, // 15 minutes
      disableSignUp: false,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],
});
