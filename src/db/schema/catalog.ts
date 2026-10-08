import { sql } from "drizzle-orm";
import { boolean, check, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameBn: text("name_bn"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("categories_slug_valid", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  check("categories_name_nonempty", sql`length(trim(${t.nameEn})) > 0`),
]);

// BDT money is stored as integer poisha. The display price lives on the product;
// a variant may override it. Inventory always lives on variants (even the default variant).
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  sku: text("sku").notNull().unique(),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  nameEn: text("name_en").notNull(),
  nameBn: text("name_bn"),
  descriptionEn: text("description_en"),
  descriptionBn: text("description_bn"),
  priceMinor: integer("price_minor").notNull(),
  compareAtMinor: integer("compare_at_minor"),
  isPublished: boolean("is_published").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  isDemo: boolean("is_demo").notNull().default(false),
  badge: text("badge"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("products_slug_valid", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  check("products_sku_nonempty", sql`length(trim(${t.sku})) > 0`),
  check("products_name_nonempty", sql`length(trim(${t.nameEn})) > 0`),
  check("products_price_positive", sql`${t.priceMinor} > 0`),
  check("products_compare_valid", sql`${t.compareAtMinor} IS NULL OR ${t.compareAtMinor} > ${t.priceMinor}`),
  check("products_demo_unpublished", sql`NOT (${t.isDemo} AND ${t.isPublished})`),
  index("products_category_published_idx").on(t.categoryId, t.isPublished),
  index("products_published_created_idx").on(t.isPublished, t.createdAt, t.id),
  index("products_featured_idx").on(t.isFeatured).where(sql`${t.isPublished} = true`),
  index("products_name_search_idx").using("gin", sql`to_tsvector('simple', ${t.nameEn})`),
]);

export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku").notNull().unique(),
  label: text("label").notNull().default("Default"),
  // e.g. {"size":"L","color":"Black"}; plain text pairs only, validated by admin in goal 06.
  attributes: jsonb("attributes").$type<Record<string, string>>().notNull().default({}),
  priceMinor: integer("price_minor"),
  trackInventory: boolean("track_inventory").notNull().default(true),
  stockQuantity: integer("stock_quantity"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("variants_sku_nonempty", sql`length(trim(${t.sku})) > 0`),
  check("variants_label_nonempty", sql`length(trim(${t.label})) > 0`),
  check("variants_price_positive", sql`${t.priceMinor} IS NULL OR ${t.priceMinor} > 0`),
  check("variants_stock_valid", sql`(${t.trackInventory} AND ${t.stockQuantity} IS NOT NULL AND ${t.stockQuantity} >= 0) OR (NOT ${t.trackInventory} AND ${t.stockQuantity} IS NULL)`),
  index("variants_product_idx").on(t.productId),
]);

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  storageKey: text("storage_key"),
  // Only retained for prototype audit; never returned as a public product image.
  demoSourceUrl: text("demo_source_url"),
  altEn: text("alt_en").notNull(),
  altBn: text("alt_bn"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("images_source_valid", sql`(${t.storageKey} IS NOT NULL AND ${t.demoSourceUrl} IS NULL AND length(trim(${t.storageKey})) > 0) OR (${t.storageKey} IS NULL AND ${t.demoSourceUrl} IS NOT NULL)`),
  check("images_sort_nonnegative", sql`${t.sortOrder} >= 0`),
  uniqueIndex("images_one_primary_per_product_idx").on(t.productId).where(sql`${t.isPrimary} = true`),
  index("images_product_order_idx").on(t.productId, t.sortOrder),
]);

export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Category = typeof categories.$inferSelect;
