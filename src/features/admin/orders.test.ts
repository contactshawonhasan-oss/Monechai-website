import { test } from "node:test";
import { strict as assert } from "node:assert";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { orderItems, orders, orderStatusHistory, shippingZones } from "../../db/schema";
import { changeOrderStatus, getOrderDetail, listOrders, nextStatuses, orderStatus, recordCodPayment } from "./orders";

test("status graph rejects invalid and terminal transitions", () => {
  assert.deepEqual(nextStatuses("pending_confirmation"), ["confirmed", "cancelled"]);
  assert.deepEqual(nextStatuses("shipped"), ["delivered"]);
  assert.deepEqual(nextStatuses("delivered"), []);
  assert.deepEqual(nextStatuses("cancelled"), []);
  assert.deepEqual(nextStatuses("placed"), []);
  assert.equal(orderStatus.safeParse("paid").success, false);
});

const url = process.env.DATABASE_URL;
test("admin queue, snapshots and atomic transition history", { skip: !url && "DATABASE_URL not set" }, async () => {
  const client = postgres(url!, { ssl: process.env.DATABASE_SSL === "disable" ? false : "require", max: 4 });
  const db = drizzle({ client });
  const zone = "inside-dhaka";
  try {
    await assert.rejects(db.transaction(async (tx) => {
      const existing = await tx.select().from(shippingZones).where(eq(shippingZones.code, zone));
      assert.equal(existing.length, 0, "use a dedicated test DB without shipping rates");
      await tx.insert(shippingZones).values({ code: zone, name: "Test zone", feeMinor: 100 });
      const [order] = await tx.insert(orders).values({ publicToken: crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", ""), orderNumber: `MC-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`,
        idempotencyKey: crypto.randomUUID(), requestHash: "test", customerName: "Test buyer", phone: "+8801712345678", address: "Test address", area: "Test area",
        shippingZoneCode: zone, shippingZoneName: "Test zone", subtotalMinor: 1000, shippingMinor: 100, totalMinor: 1100 }).returning();
      await tx.insert(orderItems).values({ orderId: order.id, productName: "Historical item", productSku: "TEST", variantSku: "TEST-1", variantLabel: "Default", attributes: {}, quantity: 1, unitPriceMinor: 1000, lineTotalMinor: 1000 });
      await tx.insert(orderStatusHistory).values({ orderId: order.id, toStatus: "pending_confirmation" });
      assert.equal((await listOrders(tx, 1, "pending_confirmation", order.orderNumber)).total, 1);
      assert.equal((await listOrders(tx, 1, "cancelled", order.orderNumber)).total, 0);
      const actor = crypto.randomUUID();
      assert.deepEqual(await changeOrderStatus(tx, order.id, "shipped", actor), { error: "This status change is not allowed. Refresh the order." });
      assert.ok("error" in await recordCodPayment(tx, order.id, actor));
      assert.deepEqual(await changeOrderStatus(tx, order.id, "confirmed", actor), { status: "confirmed" });
      assert.deepEqual(await changeOrderStatus(tx, order.id, "packed", actor), { status: "packed" });
      assert.deepEqual(await changeOrderStatus(tx, order.id, "shipped", actor), { status: "shipped" });
      assert.ok("error" in await changeOrderStatus(tx, order.id, "cancelled", actor));
      assert.deepEqual(await changeOrderStatus(tx, order.id, "delivered", actor), { status: "delivered" });
      assert.deepEqual(await recordCodPayment(tx, order.id, actor), { paymentStatus: "paid" });
      assert.ok("error" in await recordCodPayment(tx, order.id, actor));
      const detail = await getOrderDetail(tx, order.id);
      assert.equal(detail?.items[0].productName, "Historical item");
      assert.equal(detail?.history.length, 5);
      assert.equal(detail?.paymentHistory.length, 1);
      assert.equal(detail?.order.paymentStatus, "paid");
      assert.equal(detail?.order.paymentMethod, "cod");
      assert.equal((await listOrders(tx, 1, undefined, order.orderNumber)).items.length, 1);
      throw new Error("fixture rollback");
    }), /fixture rollback/);
  } finally { await client.end(); }
});
