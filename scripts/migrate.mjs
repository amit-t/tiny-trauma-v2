import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Standalone migration runner used by the DO App Platform PRE_DEPLOY job
// (and any other CI). Replaces `drizzle-kit migrate`, whose spinner
// swallows the underlying postgres-js error and leaves only a useless
// `non-zero exit code: 1` line in the deploy log.

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL is not set");
  process.exit(1);
}

const host = url.replace(/^[^@]+@/, "").split("/")[0];
const isManagedPg = url.includes("ondigitalocean.com");
console.log(`[migrate] starting host=${host} ssl=${isManagedPg ? "relaxed" : "off"}`);

const sql = postgres(url, {
  max: 1,
  ssl: isManagedPg ? { rejectUnauthorized: false } : false,
});

try {
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("[migrate] done");
} catch (err) {
  console.error("[migrate] failed:", err);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
