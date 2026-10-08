import { defineConfig } from "drizzle-kit";

// `generate` can run without a database. `migrate` needs the real connection.
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/**/*.ts",
  out: "./src/db/migrations",
  ...(migrationUrl ? { dbCredentials: { url: migrationUrl } } : {}),
});
