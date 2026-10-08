import { test } from "node:test";
import { strict as assert } from "node:assert";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { categories, orderItems, orderStatusHistory, orders, products, productVariants, shippingZones, siteSettings } from "../../db/schema";
import { CheckoutError, placeCodOrder } from "./orders";

const url = process.env.DATABASE_URL;
test("COD persistence, authoritative totals, rollback, idempotency and concurrent stock", { skip: !url && "DATABASE_URL not set" }, async () => {
  const client = postgres(url!, { ssl: process.env.DATABASE_SSL === "disable" ? false : "require", max: 8 });
  const db = drizzle({ client });
  const [category] = await db.insert(categories).values({ slug: `test-${crypto.randomUUID()}`, nameEn: "Fixture" }).returning();
  const [product] = await db.insert(products).values({ categoryId: category.id, slug: `test-${crypto.randomUUID()}`, sku: crypto.randomUUID(), nameEn: "Fixture item", priceMinor: 12500, isPublished: true }).returning();
  const [variant] = await db.insert(productVariants).values({ productId: product.id, sku: crypto.randomUUID(), stockQuantity: 2 }).returning();
  const zoneCode = "inside-dhaka";
  const priorZone = await db.select().from(shippingZones).where(eq(shippingZones.code, zoneCode));
  // Never overwrite an existing configured fee in a developer's database.
  if (priorZone.length) {
    await db.delete(productVariants).where(eq(productVariants.id, variant.id));
    await db.delete(products).where(eq(products.id, product.id));
    await db.delete(categories).where(eq(categories.id, category.id));
    await client.end();
    throw new Error("Use a dedicated test DB without configured shipping zones");
  }
  await db.insert(shippingZones).values({ code: zoneCode, name: "Inside Dhaka test", feeMinor: 6500, freeAboveMinor: 25000 });
  const keys: string[] = [];
  const failFunction = `test_fail_${crypto.randomUUID().replaceAll("-", "")}`;
  let functionCreated = false;
  let triggerCreated = false;
  const makeInput = (key: string, quantity = 1) => ({ idempotencyKey: key, items: [{ variantId: variant.id, quantity }], customerName: "Test Customer", phone: "01712345678", address: "Test address 123", area: "Test area", shippingZone: zoneCode, paymentMethod: "cod" });
  try {
    const firstKey = crypto.randomUUID(); keys.push(firstKey);
    const first = await placeCodOrder(makeInput(firstKey), db);
    assert.match(first.publicToken, /^[0-9a-f]{64}$/);
    assert.deepEqual(await placeCodOrder(makeInput(firstKey), db), first);
    await assert.rejects(placeCodOrder(makeInput(firstKey, 2), db), (e) => e instanceof CheckoutError && e.code === "KEY_REUSED");
    const [persisted] = await db.select().from(orders).where(eq(orders.idempotencyKey, firstKey));
    assert.equal(persisted.totalMinor, 19000);
    assert.equal(persisted.paymentStatus, "pending");
    assert.equal(persisted.status, "pending_confirmation");
    assert.equal((await db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, persisted.id))).length, 1);
    await db.update(siteSettings).set({ codEnabled: false }).where(eq(siteSettings.id, 1));
    try {
      assert.deepEqual(await placeCodOrder(makeInput(firstKey), db), first); // retry remains safe
      const disabledKey = crypto.randomUUID(); keys.push(disabledKey);
      await assert.rejects(placeCodOrder(makeInput(disabledKey), db), (e) => e instanceof CheckoutError && e.code === "UNAVAILABLE");
    } finally { await db.update(siteSettings).set({ codEnabled: true }).where(eq(siteSettings.id, 1)); }
    assert.equal(persisted.phone, "+8801712345678");
    const [item] = await db.select().from(orderItems).where(eq(orderItems.orderId, persisted.id));
    assert.equal(item.unitPriceMinor, 12500);
    assert.equal(item.productName, "Fixture item");
    const failedKey = crypto.randomUUID(); keys.push(failedKey);
    await assert.rejects(placeCodOrder(makeInput(failedKey, 2), db), (e) => e instanceof CheckoutError && e.code === "OUT_OF_STOCK");
    assert.equal((await db.select().from(orders).where(eq(orders.idempotencyKey, failedKey))).length, 0);
    // Force a database failure AFTER the order and snapshots were inserted.
    // A real transaction must roll back both rows and the attempted stock change.
    await client.unsafe(`create function ${failFunction}() returns trigger language plpgsql as $$ begin if new.id = '${variant.id}'::uuid then raise exception 'forced stock failure'; end if; return new; end $$`);
    functionCreated = true;
    await client.unsafe(`create trigger ${failFunction} before update on product_variants for each row execute function ${failFunction}()`);
    triggerCreated = true;
    const rollbackKey = crypto.randomUUID(); keys.push(rollbackKey);
    await assert.rejects(placeCodOrder(makeInput(rollbackKey), db), (error) => /forced stock failure/.test((error as { cause?: { message?: string } }).cause?.message ?? ""));
    assert.equal((await db.select().from(orders).where(eq(orders.idempotencyKey, rollbackKey))).length, 0);
    assert.equal((await db.select().from(productVariants).where(eq(productVariants.id, variant.id)))[0].stockQuantity, 1);
    await client.unsafe(`drop trigger ${failFunction} on product_variants`);
    triggerCreated = false;
    await client.unsafe(`drop function ${failFunction}()`);
    functionCreated = false;
    const concurrentKeys = [crypto.randomUUID(), crypto.randomUUID()]; keys.push(...concurrentKeys);
    const outcomes = await Promise.allSettled(concurrentKeys.map((key) => placeCodOrder(makeInput(key), db)));
    assert.equal(outcomes.filter((o) => o.status === "fulfilled").length, 1);
    assert.equal(outcomes.filter((o) => o.status === "rejected" && o.reason instanceof CheckoutError && o.reason.code === "OUT_OF_STOCK").length, 1);
    assert.equal((await db.select().from(productVariants).where(eq(productVariants.id, variant.id)))[0].stockQuantity, 0);
    await db.update(products).set({ isPublished: false }).where(eq(products.id, product.id));
    const hiddenKey = crypto.randomUUID(); keys.push(hiddenKey);
    await assert.rejects(placeCodOrder(makeInput(hiddenKey), db), (e) => e instanceof CheckoutError && e.code === "UNAVAILABLE");
    assert.deepEqual(await placeCodOrder(makeInput(firstKey), db), first);
  } finally {
    if (triggerCreated) await client.unsafe(`drop trigger ${failFunction} on product_variants`);
    if (functionCreated) await client.unsafe(`drop function ${failFunction}()`);
    for (const key of keys) {
      const [order] = await db.select({ id: orders.id }).from(orders).where(eq(orders.idempotencyKey, key));
      if (order) {
        await db.delete(orderItems).where(eq(orderItems.orderId, order.id));
        await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, order.id));
      }
      await db.delete(orders).where(eq(orders.idempotencyKey, key));
    }
    await db.delete(productVariants).where(eq(productVariants.id, variant.id));
    await db.delete(products).where(eq(products.id, product.id));
    await db.delete(categories).where(eq(categories.id, category.id));
    await db.delete(shippingZones).where(eq(shippingZones.code, zoneCode));
    await client.end();
  }
});
