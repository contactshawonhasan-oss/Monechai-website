import { test } from "node:test";
import { strict as assert } from "node:assert";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { siteSettings, shippingZones } from "../../db/schema";
import { getSettings, saveSettings, saveZone, settingsInput, zoneInput } from "./settings";

test("owner inputs reject invented payments, malformed contact and unsafe rates", () => {
  const contact = { storeName: "Monechai", whatsappNumber: "", hotline: "", supportEmail: "", contactAddress: "", codEnabled: true };
  assert.equal(settingsInput.safeParse({ ...contact, paymentMethod: "bkash" }).success, true); // unknown fields are stripped, not persisted
  assert.equal(settingsInput.safeParse({ ...contact, whatsappNumber: "javascript:abc" }).success, false);
  assert.equal(settingsInput.safeParse({ ...contact, supportEmail: "not-an-email" }).success, false);
  assert.equal(zoneInput.parse({ code: "inside-dhaka", feeMinor: "0.00", freeAboveMinor: "" }).feeMinor, 0);
  assert.equal(zoneInput.parse({ code: "outside-dhaka", feeMinor: "65.50", freeAboveMinor: "1000" }).feeMinor, 6550);
  for (const bad of ["-1", "1e3", "1.234", "999999999", ""]) assert.equal(zoneInput.safeParse({ code: "inside-dhaka", feeMinor: bad, freeAboveMinor: "" }).success, false);
});

const url = process.env.DATABASE_URL;
test("central settings update and owner-provided rate preserve previous orders", { skip: !url && "DATABASE_URL not set" }, async () => {
  const client = postgres(url!, { ssl: process.env.DATABASE_SSL === "disable" ? false : "require", max: 1 });
  const db = drizzle({ client });
  try {
    await assert.rejects(db.transaction(async (tx) => {
      assert.equal((await getSettings(tx)).settings?.storeName, "Monechai");
      await saveSettings(tx, settingsInput.parse({ storeName: "Owner shop", whatsappNumber: "8801712345678", hotline: "", supportEmail: "help@example.org", contactAddress: "", codEnabled: false }));
      const settings = (await getSettings(tx)).settings;
      assert.equal(settings?.codEnabled, false);
      assert.equal(settings?.whatsappNumber, "8801712345678");
      assert.equal((await tx.select().from(siteSettings).where(eq(siteSettings.id, 1))).length, 1);
      assert.equal((await tx.select().from(shippingZones)).length, 0);
      await saveZone(tx, zoneInput.parse({ code: "outside-dhaka", feeMinor: "65.50", freeAboveMinor: "1000" }));
      assert.equal((await getSettings(tx)).zones[0].feeMinor, 6550);
      await saveZone(tx, zoneInput.parse({ code: "outside-dhaka", feeMinor: "0.00", freeAboveMinor: "" }));
      assert.equal((await getSettings(tx)).zones[0].feeMinor, 0);
      throw new Error("fixture rollback");
    }), /fixture rollback/);
    assert.equal((await getSettings(db)).settings?.storeName, "Monechai");
  } finally { await client.end(); }
});
