#!/usr/bin/env node
// Creates the local sqlite auth store + applies the schema in db/auth-schema.sql.
// Idempotent. Run once before first sign-in in dev: `pnpm auth:init`.

import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

const DB_PATH = "./.data/auth.sqlite";
const SCHEMA_PATH = "./db/auth-schema.sql";

const dir = dirname(DB_PATH);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const sql = readFileSync(SCHEMA_PATH, "utf8");
db.exec(sql);

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all()
  .map((r) => r.name)
  .filter((n) => !n.startsWith("sqlite_"));

console.log(`auth db ready: ${DB_PATH}`);
console.log(`tables: ${tables.join(", ")}`);
