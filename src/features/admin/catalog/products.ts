import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { getDb } from "@/db/client";
import { categories, productImages, products, productVariants } from "@/db/schema";

const slug = z.string().trim().min(1).max(150).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const sku = z.string().trim().min(1).max(100);
const optional = (max: number) => z.string().trim().max(max).transform((s) => s || null);
// Decimal strings are parsed as integer poisha, never via floating-point arithmetic.
export const takaInput = z.string().trim().regex(/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/, "Enter a BDT amount with at most two decimal places")
  .transform((s) => {
    const [whole, fraction = ""] = s.split(".");
    return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  }).pipe(z.number().int().min(1).max(2147483647));

export const productInput = z.object({
  slug, sku, categoryId: z.uuid(), nameEn: z.string().trim().min(1).max(200), nameBn: optional(200),
  descriptionEn: optional(10000), descriptionBn: optional(10000),
  priceMinor: takaInput, compareAtMinor: z.union([takaInput, z.literal("").transform(() => null)]),
  isFeatured: z.boolean(), isPublished: z.boolean(),
}).refine((p) => p.compareAtMinor === null || p.compareAtMinor > p.priceMinor,
  { path: ["compareAtMinor"], message: "Compare-at price must exceed the selling price" });
export type ProductInput = z.output<typeof productInput>;

export const variantInput = z.object({ sku, label: z.string().trim().min(1).max(150),
  attributes: z.record(z.string().trim().min(1).max(80), z.string().trim().min(1).max(150)).refine((v) => Object.keys(v).length <= 10),
  priceMinor: z.union([takaInput, z.literal("").transform(() => null)]),
  trackInventory: z.boolean(), stockQuantity: z.number().int().min(0).max(2147483647).nullable(), isActive: z.boolean(),
}).refine((v) => v.trackInventory ? v.stockQuantity !== null : v.stockQuantity === null,
  { path: ["stockQuantity"], message: "Tracked variants require a nonnegative stock quantity" });
export type VariantInput = z.output<typeof variantInput>;
type Db = Pick<ReturnType<typeof getDb>, "select" | "insert" | "update" | "transaction">;

export async function listAdminProducts(db: Db, page: number) {
  const safePage = Number.isSafeInteger(page) && page >= 1 && page <= 100000 ? page : 1;
  const [count] = await db.select({ total: sql<number>`count(*)::int` }).from(products);
  const items = await db.select({ id: products.id, nameEn: products.nameEn, slug: products.slug,
    sku: products.sku, isPublished: products.isPublished, isDemo: products.isDemo, priceMinor: products.priceMinor,
    categoryName: categories.nameEn,
  }).from(products).innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt), asc(products.id)).limit(30).offset((safePage - 1) * 30);
  return { items, total: count.total, page: safePage };
}

export async function getAdminProduct(db: Db, id: string) {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!row) return null;
  const [variants, images] = await Promise.all([
    db.select().from(productVariants).where(eq(productVariants.productId, id)).orderBy(asc(productVariants.createdAt), asc(productVariants.id)),
    db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder), asc(productImages.id)),
  ]);
  return { ...row, variants, images };
}

export async function saveProduct(db: Db, input: ProductInput, id?: string, initialVariant?: VariantInput) {
  return db.transaction(async (tx) => {
    const [category] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.id, input.categoryId)).limit(1);
    if (!category) return { error: "Category does not exist." } as const;
    if (id) {
      const [existing] = await tx.select({ slug: products.slug, isDemo: products.isDemo }).from(products).where(eq(products.id, id)).for("update");
      if (!existing) return { error: "Product no longer exists." } as const;
      if (existing.isDemo && input.isPublished) return { error: "Demo products cannot be published. Create a verified product instead." } as const;
      if (input.isPublished) {
        const [image] = await tx.select({ id: productImages.id }).from(productImages).where(and(eq(productImages.productId, id), eq(productImages.isPrimary, true), sql`${productImages.storageKey} IS NOT NULL`)).limit(1);
        if (!image) return { error: "Add a primary uploaded photo before publishing." } as const;
      }
      await tx.update(products).set({ ...input, updatedAt: new Date() }).where(eq(products.id, id));
      return { id, oldSlug: existing.slug } as const;
    }
    if (input.isPublished) return { error: "Create a draft and add a primary uploaded photo before publishing." } as const;
    if (!initialVariant) return { error: "Add a first variant before creating a product." } as const;
    const [row] = await tx.insert(products).values({ ...input, isDemo: false }).returning({ id: products.id });
    await tx.insert(productVariants).values({ ...initialVariant, productId: row.id });
    return { id: row.id, oldSlug: null } as const;
  });
}

export async function saveVariant(db: Db, productId: string, input: VariantInput, id?: string) {
  return db.transaction(async (tx) => {
    const [product] = await tx.select({ id: products.id }).from(products).where(eq(products.id, productId)).for("update");
    if (!product) return null;
    if (id) {
      const [row] = await tx.update(productVariants).set({ ...input, updatedAt: new Date() })
        .where(and(eq(productVariants.id, id), eq(productVariants.productId, productId)))
        .returning({ id: productVariants.id });
      return row ?? null;
    }
    const [row] = await tx.insert(productVariants).values({ ...input, productId }).returning({ id: productVariants.id });
    return row;
  });
}

export async function archiveProduct(db: Db, id: string) {
  const [row] = await db.update(products).set({ isPublished: false, isFeatured: false, updatedAt: new Date() })
    .where(eq(products.id, id)).returning({ slug: products.slug });
  return row ?? null;
}
