import Link from "next/link";
import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/features/admin/auth";
import { getAdminProduct } from "@/features/admin/catalog/products";
import { ArchiveProduct, ProductForm, VariantForm } from "@/features/admin/catalog/product-forms";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const db = getDb();
  const product = await getAdminProduct(db, id);
  if (!product) notFound();
  const rows = await db.select({ id: categories.id, nameEn: categories.nameEn }).from(categories).orderBy(asc(categories.nameEn));
  return <main id="main-content" className="admin-catalog">
    <nav aria-label="Admin"><Link href="/admin/products">Products</Link> / {product.nameEn}</nav>
    <h1>{product.nameEn}</h1>
    {product.isDemo && <p className="order-notice">Unverified demo data. Create a new product with verified content/photos rather than publishing this record.</p>}
    <ProductForm product={product} categories={rows} />
    <h2>Variants and stock</h2>
    <p>Editing stock affects new purchases only; completed order snapshots remain unchanged.</p>
    {product.variants.map((v) => <VariantForm key={v.id} productId={id} variant={v} />)}
    <VariantForm productId={id} />
    <h2>Photos</h2><p>Uploads and photo ordering are not yet available. Publishing requires a primary uploaded photo.</p>
    <ArchiveProduct id={id} />
  </main>;
}
