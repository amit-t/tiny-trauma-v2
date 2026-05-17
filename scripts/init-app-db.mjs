#!/usr/bin/env node
// Creates the local app sqlite + applies db/app-schema.sql. Idempotent.
// Run once before first subscribe: `pnpm app:init`.

import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

const DB_PATH = "./.data/app.sqlite";
const SCHEMA_PATH = "./db/app-schema.sql";

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

console.log(`app db ready: ${DB_PATH}`);
console.log(`tables: ${tables.join(", ")}`);
