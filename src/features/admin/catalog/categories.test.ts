import { test } from "node:test";
import { strict as assert } from "node:assert";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { products } from "../../../db/schema/catalog";
import { categoryInput, deleteEmptyCategory, listAdminCategories, saveCategory } from "./categories";

test("category validation rejects malformed slugs, missing names and out-of-range ordering", () => {
  assert.equal(categoryInput.safeParse({ slug: "Kitchen Ware", nameEn: "Test", nameBn: "", sortOrder: "0" }).success, false);
  assert.equal(categoryInput.safeParse({ slug: "valid-category", nameEn: "  ", nameBn: "", sortOrder: "0" }).success, false);
  assert.equal(categoryInput.safeParse({ slug: "valid-category", nameEn: "Test", nameBn: "", sortOrder: "-1" }).success, false);
  assert.equal(categoryInput.safeParse({ slug: "valid-category", nameEn: "Test", nameBn: "", sortOrder: "" }).success, false);
  assert.deepEqual(categoryInput.parse({ slug: "valid-category", nameEn: " Test ", nameBn: " ", sortOrder: "2" }),
    { slug: "valid-category", nameEn: "Test", nameBn: null, sortOrder: 2 });
});

const url = process.env.DATABASE_URL;
test("category create/edit/delete guards populated categories and duplicate slugs", { skip: !url && "DATABASE_URL not set" }, async () => {
  const client = postgres(url!, { ssl: process.env.DATABASE_SSL === "disable" ? false : "require", max: 1 });
  const db = drizzle({ client });
  try {
    await assert.rejects(db.transaction(async (tx) => {
      const slug = `test-${crypto.randomUUID()}`;
      const first = await saveCategory(tx, { slug, nameEn: "Test", nameBn: null, sortOrder: 0 });
      assert.ok(first);
      assert.equal((await listAdminCategories(tx)).find((row) => row.id === first.id)?.productCount, 0);
      assert.equal((await saveCategory(tx, { slug: `${slug}-edited`, nameEn: "Updated", nameBn: "নতুন", sortOrder: 2 }, first.id))?.id, first.id);
      assert.equal(await saveCategory(tx, { slug, nameEn: "Missing", nameBn: null, sortOrder: 0 }, crypto.randomUUID()), null);
      const second = await saveCategory(tx, { slug, nameEn: "Another", nameBn: null, sortOrder: 1 });
      await assert.rejects(tx.transaction(async (nested) => {
        await saveCategory(nested, { slug, nameEn: "Duplicate", nameBn: null, sortOrder: 0 });
      }), (error: unknown) => (error as { cause?: { code?: string } }).cause?.code === "23505");
      await tx.insert(products).values({ categoryId: first.id, slug: `${slug}-product`, sku: crypto.randomUUID(), nameEn: "Hidden", priceMinor: 100 });
      assert.equal((await listAdminCategories(tx)).find((row) => row.id === first.id)?.productCount, 1);
      assert.equal(await deleteEmptyCategory(tx, first.id), false);
      assert.equal(await deleteEmptyCategory(tx, second.id), true);
      throw new Error("fixture rollback");
    }), /fixture rollback/);
  } finally {
    await client.end();
  }
});
