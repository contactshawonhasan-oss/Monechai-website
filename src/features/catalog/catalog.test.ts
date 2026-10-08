import { test } from "node:test";
import { strict as assert } from "node:assert";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { categories, products, productVariants, productImages } from "../../db/schema/catalog";
import { getPublishedProduct, listCategories, listPublishedProducts } from "./queries";

const url = process.env.DATABASE_URL;
test("catalog visibility, pagination, search and database constraints", { skip: !url && "DATABASE_URL not set" }, async () => {
  const client = postgres(url!, { ssl: process.env.DATABASE_SSL === "disable" ? false : "require", max: 1 });
  const db = drizzle({ client });
  try {
    // The fixture is always rolled back, including after assertion failures.
    await assert.rejects(db.transaction(async (tx) => {
      const [category] = await tx.insert(categories).values({ slug: `test-${crypto.randomUUID()}`, nameEn: "Test" }).returning();
      const base = { categoryId: category.id, priceMinor: 3000, nameEn: "Test Gadget" };
      const [visible] = await tx.insert(products).values({ ...base, sku: crypto.randomUUID(), slug: `test-${crypto.randomUUID()}`, isPublished: true }).returning();
      const [hidden] = await tx.insert(products).values({ ...base, sku: crypto.randomUUID(), slug: `test-${crypto.randomUUID()}` }).returning();
      await tx.insert(productVariants).values({ productId: visible.id, sku: crypto.randomUUID(), stockQuantity: 1 });
      await tx.insert(productImages).values({ productId: visible.id, storageKey: "catalog/test.jpg", altEn: "Test", isPrimary: true });
      const result = await listPublishedProducts(tx, { category: category.slug, search: "Gadget", pageSize: 1 });
      assert.equal(result.total, 1);
      assert.ok((await listCategories(tx)).some((c) => c.id === category.id));
      const [emptyCategory] = await tx.insert(categories).values({ slug: `test-${crypto.randomUUID()}`, nameEn: "Empty" }).returning();
      assert.ok(!(await listCategories(tx)).some((c) => c.id === emptyCategory.id));
      assert.equal(result.items[0].available, true);
      assert.equal(result.items[0].id, visible.id);
      assert.equal(result.items[0].primaryStorageKey, "catalog/test.jpg");
      assert.equal((await listPublishedProducts(tx, { category: category.slug, page: 2, pageSize: 1 })).items.length, 0);
      assert.equal((await listPublishedProducts(tx, { category: category.slug, search: "Gad_et" })).total, 0);
      await assert.rejects(listPublishedProducts(tx, { pageSize: 1000 }), /too_big|<=48/i);
      assert.equal((await getPublishedProduct(tx, hidden.slug)), null);
      assert.equal((await getPublishedProduct(tx, visible.slug))?.variants[0].available, true);
      const sqlState = (code: string) => (error: unknown) => (error as { cause?: { code?: string } }).cause?.code === code;
      await assert.rejects(tx.transaction(async (nested) => {
        await nested.insert(products).values({ ...base, sku: crypto.randomUUID(), slug: visible.slug });
      }), sqlState("23505"));
      await assert.rejects(tx.transaction(async (nested) => {
        await nested.insert(productVariants).values({ productId: visible.id, sku: crypto.randomUUID(), stockQuantity: -1 });
      }), sqlState("23514"));
      await assert.rejects(tx.transaction(async (nested) => {
        await nested.insert(products).values({ ...base, sku: crypto.randomUUID(), slug: `test-${crypto.randomUUID()}`, isPublished: true, isDemo: true });
      }), sqlState("23514"));
      throw new Error("fixture rollback");
    }), /fixture rollback/);
  } finally {
    await client.end();
  }
});
