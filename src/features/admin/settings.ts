import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { shippingZones, siteSettings } from "@/db/schema";
import { takaInput } from "./catalog/products";
const feeInput = z.string().trim().regex(/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/).transform((s) => {
  const [whole, fraction = ""] = s.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}).pipe(z.number().int().min(0).max(2147483647));

const optional = (max: number) => z.string().trim().max(max).transform((s) => s || null);
export const settingsInput = z.object({
  storeName: z.string().trim().min(1).max(120),
  whatsappNumber: z.union([z.literal(""), z.string().regex(/^[1-9]\d{7,14}$/, "Use international digits only, e.g. 8801…")]),
  hotline: optional(40), supportEmail: z.union([z.literal(""), z.email().max(254)]), contactAddress: optional(500),
  codEnabled: z.boolean(),
});
export const zoneInput = z.object({
  code: z.enum(["inside-dhaka", "outside-dhaka"]),
  feeMinor: feeInput,
  freeAboveMinor: z.union([takaInput, z.literal("").transform(() => null)]),
});

type Db = Pick<ReturnType<typeof getDb>, "select" | "insert" | "update">;
export async function getSettings(db: Db) {
  const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
  const zones = await db.select().from(shippingZones);
  return { settings, zones };
}
export async function saveSettings(db: Db, input: z.output<typeof settingsInput>) {
  await db.update(siteSettings).set({ ...input, whatsappNumber: input.whatsappNumber || null,
    supportEmail: input.supportEmail || null, updatedAt: new Date() }).where(eq(siteSettings.id, 1));
}
export async function saveZone(db: Db, input: z.output<typeof zoneInput>) {
  await db.insert(shippingZones).values({ ...input, name: input.code === "inside-dhaka" ? "Inside Dhaka" : "Outside Dhaka" })
    .onConflictDoUpdate({ target: shippingZones.code, set: { feeMinor: input.feeMinor, freeAboveMinor: input.freeAboveMinor, updatedAt: new Date() } });
}
