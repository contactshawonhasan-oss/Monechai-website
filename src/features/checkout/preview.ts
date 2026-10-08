import "server-only";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { products, productVariants, shippingZones, siteSettings } from "@/db/schema";
import { calculateTotals, cartSchema } from "./domain";
import { localizedText, type Locale } from "@/i18n/dictionary";

export async function previewCart(raw: unknown, zoneCode: "inside-dhaka" | "outside-dhaka", db = getDb(), locale: Locale = "en") {
  const items = cartSchema.parse(raw);
  const rows = await db.select({ variantId: productVariants.id, productId: products.id, name: products.nameEn, nameBn: products.nameBn,
    label: productVariants.label, priceMinor: productVariants.priceMinor, basePriceMinor: products.priceMinor,
    active: productVariants.isActive, published: products.isPublished, demo: products.isDemo,
    stock: productVariants.stockQuantity, trackInventory: productVariants.trackInventory,
  }).from(productVariants).innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, items.map((item) => item.variantId)));
  const byId = new Map(rows.map((row) => [row.variantId, row]));
  const lines = items.map(({ variantId, quantity }) => {
    const row = byId.get(variantId);
    const available = !!row && row.active && row.published && !row.demo && (!row.trackInventory || (row.stock ?? 0) >= quantity);
    return { variantId, quantity, name: row ? localizedText(locale, row.name, row.nameBn) : locale === "bn" ? "সরানো পণ্য" : "Removed item", label: row?.label ?? "", unitPriceMinor: available ? (row.priceMinor ?? row.basePriceMinor) : null, available };
  });
  const [[zone], [settings]] = await Promise.all([
    db.select().from(shippingZones).where(eq(shippingZones.code, zoneCode)).limit(1),
    db.select({ codEnabled: siteSettings.codEnabled }).from(siteSettings).where(eq(siteSettings.id, 1)).limit(1),
  ]);
  const paymentAvailable = !!settings?.codEnabled;
  const totals = zone && paymentAvailable && lines.every((line) => line.available && line.unitPriceMinor !== null)
    ? calculateTotals(lines.map((line) => ({ quantity: line.quantity, unitPriceMinor: line.unitPriceMinor! })), zone) : null;
  return { lines, zoneConfigured: !!zone, zoneName: zone?.name ?? null, paymentAvailable, totals };
}
