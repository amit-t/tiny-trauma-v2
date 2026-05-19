import { defineConfig } from "drizzle-kit";

// DO Managed Postgres uses a self-signed CA chain by default, so node's
// `pg` client (used by drizzle-kit migrate) rejects the cert under
// `sslmode=require` unless we relax verification. We only relax it when
// the DATABASE_URL is actually a managed-DB host — the local docker dev
// DB has no SSL at all.
const isManagedPg = (process.env.DATABASE_URL ?? "").includes("ondigitalocean.com");

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://tt:tt@localhost:5432/tinytrauma",
    ssl: isManagedPg ? { rejectUnauthorized: false } : false,
  },
  strict: true,
  verbose: true,
});
