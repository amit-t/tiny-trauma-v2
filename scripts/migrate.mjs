import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import postgres from "postgres";

// Standalone migration runner used by the DO App Platform PRE_DEPLOY job.
// We don't use `drizzle-orm/postgres-js/migrator` here because it issues
// `CREATE SCHEMA IF NOT EXISTS "drizzle"` (or whatever migrationsSchema
// is) unconditionally, and that statement requires `CREATE` on the
// database. DO's auto-provisioned app-DB user only has `CREATE` on
// `public`, so the migrator dies with `permission denied for database`
// before any of our SQL runs.
//
// This runner replicates the drizzle migrator's protocol — a
// `__drizzle_migrations(hash, created_at)` row per applied SQL file,
// keyed by SHA256 of the file content — but parks the table in
// `public` and never tries to create a schema.

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

const MIGRATIONS_DIR = "db/migrations";
const STATEMENT_BREAKPOINT = "--> statement-breakpoint";

try {
  await sql`
    CREATE TABLE IF NOT EXISTS public.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT
    )
  `;

  const applied = await sql`SELECT hash FROM public.__drizzle_migrations`;
  const appliedHashes = new Set(applied.map((r) => r.hash));

  const journalText = await readFile(
    path.join(MIGRATIONS_DIR, "meta", "_journal.json"),
    "utf8",
  );
  const journal = JSON.parse(journalText);

  let appliedCount = 0;
  let skippedCount = 0;

  for (const entry of journal.entries) {
    const file = path.join(MIGRATIONS_DIR, `${entry.tag}.sql`);
    const body = await readFile(file, "utf8");
    const hash = createHash("sha256").update(body).digest("hex");

    if (appliedHashes.has(hash)) {
      console.log(`[migrate] skip   ${entry.tag}`);
      skippedCount++;
      continue;
    }

    console.log(`[migrate] apply  ${entry.tag}`);
    const statements = body
      .split(STATEMENT_BREAKPOINT)
      .map((s) => s.trim())
      .filter(Boolean);

    await sql.begin(async (tx) => {
      for (const stmt of statements) {
        await tx.unsafe(stmt);
      }
      await tx`
        INSERT INTO public.__drizzle_migrations (hash, created_at)
        VALUES (${hash}, ${Date.now()})
      `;
    });
    appliedCount++;
  }

  console.log(`[migrate] done applied=${appliedCount} skipped=${skippedCount}`);
} catch (err) {
  console.error("[migrate] failed:", err);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
