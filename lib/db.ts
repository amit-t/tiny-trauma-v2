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
const sql = postgres(env.DATABASE_URL, {
  max: 5,
  idle_timeout: 20,
});

export const db = drizzle(sql, { schema });

export { schema };
