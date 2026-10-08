import { test } from "node:test";
import { strict as assert } from "node:assert";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { categories, productImages } from "../../../db/schema/catalog";
import { getPublishedProduct } from "../../catalog/queries";
import { archiveProduct, getAdminProduct, listAdminProducts, productInput, saveProduct, saveVariant, takaInput, variantInput } from "./products";

test("BDT input parses integer poisha and rejects scientific/negative/overprecision/overflow", () => {
  assert.equal(takaInput.parse("120.05"), 12005);
  assert.equal(takaInput.parse("1.2"), 120);
  for (const bad of ["1e3", "-2", "0", "12.345", "99999999", "123,45", "1.00 ".repeat(2)]) {
    assert.equal(takaInput.safeParse(bad).success, false, bad);
  }
  assert.equal(productInput.safeParse({ slug: "test", sku: "s", categoryId: crypto.randomUUID(), nameEn: "A", nameBn: "", descriptionEn: "", descriptionBn: "", priceMinor: "2", compareAtMinor: "1", isFeatured: false, isPublished: false }).success, false);
  assert.equal(variantInput.safeParse({ sku: "s", label: "A", attributes: { size: "L" }, priceMinor: "", trackInventory: true, stockQuantity: null, isActive: true }).success, false);
});

const url = process.env.DATABASE_URL;
test("draft product, variant edits, publish gating and historical archive visibility", { skip: !url && "DATABASE_URL not set" }, async () => {
  const client = postgres(url!, { ssl: process.env.DATABASE_SSL === "disable" ? false : "require", max: 1 });
  const db = drizzle({ client });
  try {
    await assert.rejects(db.transaction(async (tx) => {
      const [category] = await tx.insert(categories).values({ nameEn: "Admin fixture", slug: `test-${crypto.randomUUID()}` }).returning();
      const slug = `test-${crypto.randomUUID()}`;
      const base = productInput.parse({ slug, sku: crypto.randomUUID(), categoryId: category.id, nameEn: "Verified", nameBn: "পরীক্ষা", descriptionEn: "Detailed", descriptionBn: "", priceMinor: "45.50", compareAtMinor: "50", isFeatured: true, isPublished: false });
      const variant = variantInput.parse({ sku: crypto.randomUUID(), label: "Default", attributes: {}, priceMinor: "", stockQuantity: 3, trackInventory: true, isActive: true });
      assert.ok("error" in await saveProduct(tx, { ...base, isPublished: true }, undefined, variant));
      const created = await saveProduct(tx, base, undefined, variant);
      assert.ok("id" in created);
      const id = created.id!;
      assert.equal((await listAdminProducts(tx, 1)).items.some((p) => p.id === id), true);
      assert.equal(await getPublishedProduct(tx, slug), null);
      assert.equal((await getAdminProduct(tx, id))?.variants[0].stockQuantity, 3);
      assert.ok("error" in await saveProduct(tx, { ...base, isPublished: true }, id));
      await tx.insert(productImages).values({ productId: id, storageKey: `${id}/fixture.jpg`, altEn: "Verified", isPrimary: true });
      const published = await saveProduct(tx, { ...base, isPublished: true }, id);
      assert.ok("id" in published);
      assert.equal((await getPublishedProduct(tx, slug))?.variants.length, 1);
      const variantId = (await getAdminProduct(tx, id))!.variants[0].id;
      assert.equal((await saveVariant(tx, id, { ...variant, stockQuantity: 0 }, variantId))?.id, variantId);
      assert.equal((await getPublishedProduct(tx, slug))?.variants[0].available, false);
      assert.equal(await saveVariant(tx, crypto.randomUUID(), variant), null);
      assert.equal((await archiveProduct(tx, id))?.slug, slug);
      assert.equal(await getPublishedProduct(tx, slug), null);
      throw new Error("fixture rollback");
    }), /fixture rollback/);
  } finally { await client.end(); }
});
