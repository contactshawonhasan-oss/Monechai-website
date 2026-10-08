import { test } from "node:test";
import { strict as assert } from "node:assert";
import { adminDecision } from "./policy";
import { isAdminMember } from "./membership";
import { getDb } from "../../db/client";
import { adminMembers } from "../../db/schema/admin";
import { eq } from "drizzle-orm";

test("admin policy denies missing sessions and non-members, permits only member IDs", async () => {
  const id = crypto.randomUUID();
  let lookups = 0;
  const lookup = async (candidate: string) => { lookups++; return candidate === id; };
  assert.equal(await adminDecision(null, lookup), "unauthenticated");
  assert.equal(lookups, 0);
  assert.equal(await adminDecision(crypto.randomUUID(), lookup), "forbidden");
  assert.equal(await adminDecision(id, lookup), "admin");
});

test("admin whitelist lookup only accepts an explicitly stored UUID", { skip: !process.env.DATABASE_URL && "DATABASE_URL not set" }, async () => {
  const id = crypto.randomUUID();
  assert.equal(await isAdminMember("not-a-uuid"), false);
  assert.equal(await isAdminMember(id), false);
  try {
    await getDb().insert(adminMembers).values({ userId: id });
    assert.equal(await isAdminMember(id), true);
    assert.equal(await isAdminMember(crypto.randomUUID()), false);
  } finally {
    await getDb().delete(adminMembers).where(eq(adminMembers.userId, id));
  }
  assert.equal(await isAdminMember(id), false);
});
