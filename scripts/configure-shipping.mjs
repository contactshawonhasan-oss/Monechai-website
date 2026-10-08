// Owner-run CLI only. No default delivery prices are assumed by the application.
import postgres from "postgres";

const max = 2147483647;
function amount(name, required = true) {
  const raw = process.env[name];
  if ((!raw || !/^\d+$/.test(raw)) && (required || raw)) throw new Error(`${name} must be a nonnegative integer amount in poisha`);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value > max || (!required && value === 0)) throw new Error(`${name} is out of range`);
  return value;
}
const inside = amount("SHIPPING_INSIDE_DHAKA_MINOR");
const outside = amount("SHIPPING_OUTSIDE_DHAKA_MINOR");
const freeAbove = amount("SHIPPING_FREE_ABOVE_MINOR", false);
console.log(`Shipping configuration (poisha): inside=${inside}, outside=${outside}, freeAbove=${freeAbove ?? "disabled"}`);
if (!process.argv.includes("--apply")) {
  console.log("Dry run. Pass --apply to upsert both zones after owner approval.");
  process.exit(0);
}
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url || !/^postgres(ql)?:\/\//.test(url)) throw new Error("DIRECT_URL or DATABASE_URL is required to apply shipping configuration");
const db = postgres(url, { ssl: process.env.DATABASE_SSL === "disable" ? false : "require", max: 1, prepare: false });
try {
  await db.begin(async (tx) => {
    await tx`insert into shipping_zones (code, name, fee_minor, free_above_minor) values ('inside-dhaka','Inside Dhaka',${inside},${freeAbove}) on conflict (code) do update set name=excluded.name, fee_minor=excluded.fee_minor, free_above_minor=excluded.free_above_minor, updated_at=now()`;
    await tx`insert into shipping_zones (code, name, fee_minor, free_above_minor) values ('outside-dhaka','Outside Dhaka',${outside},${freeAbove}) on conflict (code) do update set name=excluded.name, fee_minor=excluded.fee_minor, free_above_minor=excluded.free_above_minor, updated_at=now()`;
  });
  console.log("Shipping zones configured.");
} finally {
  await db.end();
}
