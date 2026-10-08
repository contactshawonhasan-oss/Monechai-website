import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseEnv } from "@/lib/env";

let client: ReturnType<typeof postgres> | undefined;

export function getDb() {
  if (!client) {
    const env = getDatabaseEnv();
    client = postgres(env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      prepare: false,
      ssl: env.DATABASE_SSL === "require" ? "require" : false,
    });
  }
  return drizzle({ client });
}
