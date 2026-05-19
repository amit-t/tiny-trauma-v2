import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "./env";
import * as schema from "@/db/schema";

/**
 * Singleton Postgres client + Drizzle instance shared by every server
 * code path (better-auth via drizzleAdapter, subscribers, campaigns,
 * subscribe_events). One pool, one schema.
 *
 * Connection limit 5 by default — DO managed Postgres on the smallest
 * plan accepts ~25, leaving room for Drizzle Studio + ad-hoc psql.
 */
// DO Managed Postgres serves a self-signed CA, so postgres-js's default
// strict verification fails. Relax only for managed hosts; local docker
// dev still runs over plain TCP without TLS.
const isManagedPg = env.DATABASE_URL.includes("ondigitalocean.com");

const sql = postgres(env.DATABASE_URL, {
  max: 5,
  idle_timeout: 20,
  ssl: isManagedPg ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(sql, { schema });

export { schema };
