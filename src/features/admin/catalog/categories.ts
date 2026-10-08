import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { getDb } from "@/db/client";
import { categories, products } from "@/db/schema";

// No Next import: repository logic can be exercised against a rolled-back test transaction.
export const categoryInput = z.object({
  slug: z.string().trim().max(150).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  nameEn: z.string().trim().min(1).max(150),
  nameBn: z.string().trim().max(150).transform((value) => value || null),
  sortOrder: z.string().regex(/^(0|[1-9][0-9]*)$/, "Enter a whole number").transform(Number).pipe(z.number().int().min(0).max(100000)),
});
export type CategoryInput = z.output<typeof categoryInput>;
type Db = Pick<ReturnType<typeof getDb>, "select" | "insert" | "update" | "delete">;

export function listAdminCategories(db: Db) {
  return db.select({ id: categories.id, slug: categories.slug, nameEn: categories.nameEn,
    nameBn: categories.nameBn, sortOrder: categories.sortOrder,
    productCount: sql<number>`count(${products.id})::int`,
  }).from(categories).leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id).orderBy(asc(categories.sortOrder), asc(categories.slug));
}

export async function saveCategory(db: Db, input: CategoryInput, id?: string) {
  if (id) {
    const [row] = await db.update(categories).set({ ...input, updatedAt: new Date() })
      .where(eq(categories.id, id)).returning({ id: categories.id });
    return row ?? null;
  }
  const [row] = await db.insert(categories).values(input).returning({ id: categories.id });
  return row;
}

// A category with any products (including unpublished demos) cannot be deleted.
// The FK RESTRICT also prevents concurrent product creation from racing this deletion.
export async function deleteEmptyCategory(db: Db, id: string) {
  const [row] = await db.delete(categories).where(sql`${categories.id} = ${id} AND NOT EXISTS (
    SELECT 1 FROM ${products} WHERE ${products.categoryId} = ${categories.id}
  )`).returning({ id: categories.id });
  return Boolean(row);
}
