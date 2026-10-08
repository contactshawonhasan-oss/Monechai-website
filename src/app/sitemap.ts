import type { MetadataRoute } from "next";
import { asc, eq, and } from "drizzle-orm";
import { getDb } from "@/db/client";
import { products } from "@/db/schema";
import { publicSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = publicSiteOrigin();
  if (!origin) return [];
  const rows = await getDb().select({ slug: products.slug, updatedAt: products.updatedAt }).from(products)
    .where(and(eq(products.isPublished, true), eq(products.isDemo, false))).orderBy(asc(products.slug));
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/shop`, changeFrequency: "daily", priority: 0.8 },
    ...rows.map((row) => ({ url: `${origin}/products/${row.slug}`, lastModified: row.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
