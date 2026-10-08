import { and, asc, desc, eq, exists, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { getDb } from "@/db/client";
import { categories, productImages, products, productVariants } from "@/db/schema";

export const catalogFilters = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
  category: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "name"]).default("newest"),
  featured: z.boolean().optional(),
});
export type CatalogFilters = z.input<typeof catalogFilters>;
type Db = Pick<ReturnType<typeof getDb>, "select">;

export async function listCategories(db: Db) {
  return db.select({ id: categories.id, slug: categories.slug, nameEn: categories.nameEn, nameBn: categories.nameBn })
    .from(categories).where(exists(db.select({ id: products.id }).from(products).where(and(
      eq(products.categoryId, categories.id), eq(products.isPublished, true), eq(products.isDemo, false),
    )))).orderBy(asc(categories.sortOrder), asc(categories.slug));
}

export async function listPublishedProducts(db: Db, input: CatalogFilters = {}) {
  const filter = catalogFilters.parse(input);
  const where = and(
    eq(products.isPublished, true), eq(products.isDemo, false),
    filter.category ? eq(categories.slug, filter.category) : undefined,
    filter.featured ? eq(products.isFeatured, true) : undefined,
    filter.search ? or(ilike(products.nameEn, `%${filter.search.replace(/[\\%_]/g, "\\$&")}%`), ilike(products.nameBn, `%${filter.search.replace(/[\\%_]/g, "\\$&")}%`)) : undefined,
  );
  const order = filter.sort === "price-asc" ? asc(products.priceMinor) :
    filter.sort === "price-desc" ? desc(products.priceMinor) :
    filter.sort === "name" ? asc(products.nameEn) : desc(products.createdAt);
  const [count] = await db.select({ total: sql<number>`count(*)::int` }).from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id)).where(where);
  const items = await db.select({
    id: products.id, slug: products.slug, nameEn: products.nameEn, nameBn: products.nameBn,
    priceMinor: products.priceMinor, compareAtMinor: products.compareAtMinor,
    categorySlug: categories.slug, featured: products.isFeatured,
    primaryStorageKey: productImages.storageKey,
    primaryAlt: productImages.altEn, primaryAltBn: productImages.altBn,
    available: sql<boolean>`exists (select 1 from ${productVariants} v where v.product_id = ${products.id} and v.is_active = true and (v.track_inventory = false or v.stock_quantity > 0))`,
  }).from(products).innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true), sql`${productImages.storageKey} IS NOT NULL`))
    .where(where).orderBy(order, asc(products.id)).limit(filter.pageSize).offset((filter.page - 1) * filter.pageSize);
  return { items, total: count.total, page: filter.page, pageSize: filter.pageSize };
}

export async function getPublishedProduct(db: Db, slug: string) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const [product] = await db.select({
    id: products.id, slug: products.slug, nameEn: products.nameEn, nameBn: products.nameBn,
    descriptionEn: products.descriptionEn, descriptionBn: products.descriptionBn,
    priceMinor: products.priceMinor, compareAtMinor: products.compareAtMinor,
    categorySlug: categories.slug, categoryNameEn: categories.nameEn, categoryNameBn: categories.nameBn, featured: products.isFeatured, badge: products.badge,
  }).from(products).innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.isPublished, true), eq(products.isDemo, false))).limit(1);
  if (!product) return null;
  const [variants, images] = await Promise.all([
    db.select({ id: productVariants.id, label: productVariants.label, attributes: productVariants.attributes,
      priceMinor: productVariants.priceMinor, available: sql<boolean>`(NOT ${productVariants.trackInventory} OR ${productVariants.stockQuantity} > 0)` })
      .from(productVariants).where(and(eq(productVariants.productId, product.id), eq(productVariants.isActive, true)))
      .orderBy(asc(productVariants.createdAt), asc(productVariants.id)),
    db.select({ storageKey: productImages.storageKey, altEn: productImages.altEn, altBn: productImages.altBn })
      .from(productImages).where(and(eq(productImages.productId, product.id), sql`${productImages.storageKey} IS NOT NULL`))
      .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder), asc(productImages.id)),
  ]);
  return { ...product, variants, images };
}
