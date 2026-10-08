import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/features/admin/auth";
import { ProductForm } from "@/features/admin/catalog/product-forms";

export default async function NewProductPage() {
  await requireAdmin();
  const rows = await getDb().select({ id: categories.id, nameEn: categories.nameEn }).from(categories).orderBy(asc(categories.nameEn));
  return <main id="main-content" className="admin-catalog"><nav><Link href="/admin/products">Products</Link> / New</nav>
    <h1>New product</h1>
    {!rows.length && <p>Create a <Link href="/admin/categories">category</Link> first.</p>}
    <ProductForm categories={rows} />
  </main>;
}
