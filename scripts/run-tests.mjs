// Unit tests run without a database by default. Database integration tests run only
// against an explicitly named local test database, never an inherited app URL.
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const url = process.env.TEST_DATABASE_URL;
if (url) {
  let target;
  try { target = new URL(url); } catch { throw new Error("Invalid TEST_DATABASE_URL"); }
  if (target.protocol !== "postgres:" && target.protocol !== "postgresql:") throw new Error("TEST_DATABASE_URL must be PostgreSQL");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || target.pathname !== "/monechai_test") {
    throw new Error("TEST_DATABASE_URL must point to local /monechai_test (never a shared database)");
  }
}
const env = { ...process.env };
if (url) env.DATABASE_URL = url;
else delete env.DATABASE_URL;
const locations = ["src/lib", "src/features/catalog", "src/features/checkout", "src/features/admin", "src/features/admin/catalog"];
const files = locations.flatMap((dir) => readdirSync(dir).filter((file) => /\.test\.(ts|mjs)$/.test(file)).map((file) => `${dir}/${file}`));
const result = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "--test", "--test-concurrency=1", ...files], { env, stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
