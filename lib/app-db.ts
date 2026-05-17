import "server-only";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

const DB_PATH = "./.data/app.sqlite";

function openDb(): Database.Database {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

/**
 * Singleton sqlite handle for the app data (subscribers, campaigns, events).
 * Separate file from auth.sqlite so each domain can be backed up / migrated
 * independently when phase 6 deploys this to Postgres.
 */
export const appDb = openDb();

export function nowMs(): number {
  return Date.now();
}
