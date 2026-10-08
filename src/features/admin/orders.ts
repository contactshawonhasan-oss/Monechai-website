import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { orderItems, orderPaymentHistory, orders, orderStatusHistory } from "@/db/schema";

export const orderStatus = z.enum(["pending_confirmation", "confirmed", "packed", "shipped", "delivered", "cancelled"]);
export type OrderStatus = z.infer<typeof orderStatus>;
const allowed: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_confirmation: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
export function nextStatuses(status: string): readonly OrderStatus[] {
  const parsed = orderStatus.safeParse(status);
  return parsed.success ? allowed[parsed.data] : [];
}

// Call requireAdmin in every caller BEFORE invoking these queries (no public API export).
type Db = Pick<ReturnType<typeof getDb>, "select" | "insert" | "update" | "transaction">;

export async function listOrders(db: Db, page: number, status?: OrderStatus, number?: string) {
  const safePage = Number.isSafeInteger(page) && page >= 1 && page <= 100000 ? page : 1;
  const where = and(status ? eq(orders.status, status) : undefined, number ? eq(orders.orderNumber, number) : undefined);
  const [count] = await db.select({ total: sql<number>`count(*)::int` }).from(orders).where(where);
  const items = await db.select({ id: orders.id, orderNumber: orders.orderNumber, createdAt: orders.createdAt,
    customerName: orders.customerName, phone: orders.phone, area: orders.area,
    totalMinor: orders.totalMinor, paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus, status: orders.status,
  }).from(orders).where(where).orderBy(desc(orders.createdAt), desc(orders.id)).limit(30).offset((safePage - 1) * 30);
  return { items, total: count.total, page: safePage };
}

export async function getOrderDetail(db: Db, id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const [items, history, paymentHistory] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(asc(orderItems.id)),
    db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(asc(orderStatusHistory.createdAt), asc(orderStatusHistory.id)),
    db.select().from(orderPaymentHistory).where(eq(orderPaymentHistory.orderId, id)).orderBy(asc(orderPaymentHistory.createdAt), asc(orderPaymentHistory.id)),
  ]);
  return { order, items, history, paymentHistory };
}

// No browser payment field is accepted. Only the authenticated admin may record cash
// physically received after delivery; refunded/failed require a real reconciliation flow.
export async function recordCodPayment(db: Db, id: string, actorUserId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select({ status: orders.status, paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus })
      .from(orders).where(eq(orders.id, id)).for("update");
    if (!order) return { error: "Order not found." } as const;
    if (order.status !== "delivered" || order.paymentMethod !== "cod" || order.paymentStatus !== "pending")
      return { error: "Cash can be recorded only once, after COD delivery." } as const;
    await tx.update(orders).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(orders.id, id));
    await tx.insert(orderPaymentHistory).values({ orderId: id, fromStatus: "pending", toStatus: "paid", actorUserId });
    return { paymentStatus: "paid" } as const;
  });
}

export async function changeOrderStatus(db: Db, id: string, to: OrderStatus, actorUserId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, id)).for("update");
    if (!order) return { error: "Order not found." } as const;
    if (!nextStatuses(order.status).includes(to)) return { error: "This status change is not allowed. Refresh the order." } as const;
    await tx.update(orders).set({ status: to, updatedAt: new Date() }).where(eq(orders.id, id));
    await tx.insert(orderStatusHistory).values({ orderId: id, fromStatus: order.status, toStatus: to, actorUserId });
    return { status: to } as const;
  });
}
