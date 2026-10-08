import Link from "next/link";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/features/admin/auth";
import { listAdminProducts } from "@/features/admin/catalog/products";
import { formatBdt } from "@/lib/money";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const { page: rawPage } = await searchParams;
  const page = rawPage && /^[1-9]\d{0,4}$/.test(rawPage) ? Number(rawPage) : 1;
  const { items, total } = await listAdminProducts(getDb(), page);
  return <main id="main-content" className="admin-catalog">
    <nav aria-label="Admin"><Link href="/admin">Dashboard</Link> / Products</nav>
    <h1>Products</h1>
    <p><Link className="button button-gold" href="/admin/products/new">Add product</Link> · <Link href="/admin/categories">Manage categories</Link></p>
    <p>{total} products, including drafts and demo records.</p>
    <ul className="admin-product-list">{items.map((p) => <li key={p.id} className="admin-card">
      <Link href={`/admin/products/${p.id}`}><strong>{p.nameEn}</strong></Link> · {p.sku} · {p.categoryName} · {formatBdt(p.priceMinor)}
      <span> {p.isDemo ? "Demo — cannot publish" : p.isPublished ? "Published" : "Draft"}</span>
    </li>)}</ul>
    {!items.length && <p>No products on this page.</p>}
    <nav aria-label="Product pages" className="pagination">{page > 1 && <Link href={`/admin/products?page=${page - 1}`}>Previous</Link>}
      <span>Page {page}</span>{page * 30 < total && <Link href={`/admin/products?page=${page + 1}`}>Next</Link>}</nav>
  </main>;
}
