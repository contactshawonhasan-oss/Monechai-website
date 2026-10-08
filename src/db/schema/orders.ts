import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { products, productVariants } from "./catalog";

// Rates are deliberately not seeded: the owner must configure real shipping charges.
export const shippingZones = pgTable("shipping_zones", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  feeMinor: integer("fee_minor").notNull(),
  freeAboveMinor: integer("free_above_minor"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("shipping_zone_code_valid", sql`${t.code} IN ('inside-dhaka', 'outside-dhaka')`),
  check("shipping_zone_name_valid", sql`length(trim(${t.name})) > 0`),
  check("shipping_zone_fee_valid", sql`${t.feeMinor} >= 0`),
  check("shipping_zone_threshold_valid", sql`${t.freeAboveMinor} IS NULL OR ${t.freeAboveMinor} > 0`),
]);

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicToken: text("public_token").notNull().unique(),
  orderNumber: text("order_number").notNull().unique(),
  idempotencyKey: uuid("idempotency_key").notNull().unique(),
  requestHash: text("request_hash").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  area: text("area").notNull(),
  note: text("note"),
  shippingZoneCode: text("shipping_zone_code").notNull().references(() => shippingZones.code, { onDelete: "restrict" }),
  shippingZoneName: text("shipping_zone_name").notNull(),
  subtotalMinor: integer("subtotal_minor").notNull(),
  shippingMinor: integer("shipping_minor").notNull(),
  discountMinor: integer("discount_minor").notNull().default(0),
  totalMinor: integer("total_minor").notNull(),
  paymentMethod: text("payment_method").notNull().default("cod"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  status: text("status").notNull().default("pending_confirmation"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("orders_payment_method_valid", sql`${t.paymentMethod} = 'cod'`),
  check("orders_payment_status_valid", sql`${t.paymentStatus} IN ('pending','paid','failed','refunded')`),
  check("orders_status_valid", sql`${t.status} IN ('pending_confirmation','confirmed','packed','shipped','delivered','cancelled')`),
  check("orders_totals_valid", sql`${t.subtotalMinor} > 0 AND ${t.shippingMinor} >= 0 AND ${t.discountMinor} >= 0 AND ${t.totalMinor} = ${t.subtotalMinor} + ${t.shippingMinor} - ${t.discountMinor}`),
  check("orders_contact_valid", sql`length(trim(${t.customerName})) > 0 AND length(trim(${t.address})) > 0 AND length(trim(${t.area})) > 0 AND ${t.phone} ~ '^\\+8801[3-9][0-9]{8}$'`),
  index("orders_created_idx").on(t.createdAt, t.id),
]);

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  actorUserId: uuid("actor_user_id"), // Supabase Auth identity, not a browser-provided value.
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("history_from_valid", sql`${t.fromStatus} IS NULL OR ${t.fromStatus} IN ('pending_confirmation','confirmed','packed','shipped','delivered','cancelled')`),
  check("history_to_valid", sql`${t.toStatus} IN ('pending_confirmation','confirmed','packed','shipped','delivered','cancelled')`),
  index("history_order_idx").on(t.orderId, t.createdAt, t.id),
]);

export const orderPaymentHistory = pgTable("order_payment_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  fromStatus: text("from_status").notNull(),
  toStatus: text("to_status").notNull(),
  actorUserId: uuid("actor_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("payment_history_cod_valid", sql`${t.fromStatus} = 'pending' AND ${t.toStatus} = 'paid'`),
  index("payment_history_order_idx").on(t.orderId, t.createdAt),
]);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  productSku: text("product_sku").notNull(),
  variantSku: text("variant_sku").notNull(),
  variantLabel: text("variant_label").notNull(),
  attributes: jsonb("attributes").$type<Record<string, string>>().notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceMinor: integer("unit_price_minor").notNull(),
  lineTotalMinor: integer("line_total_minor").notNull(),
}, (t) => [
  check("order_items_amount_valid", sql`${t.quantity} BETWEEN 1 AND 20 AND ${t.unitPriceMinor} > 0 AND ${t.lineTotalMinor} = ${t.unitPriceMinor} * ${t.quantity}`),
  uniqueIndex("order_items_order_variant_idx").on(t.orderId, t.variantId),
  index("order_items_order_idx").on(t.orderId),
]);
