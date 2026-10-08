import Link from "next/link";
import { requireAdmin } from "@/features/admin/auth";
import { getDb } from "@/db/client";
import { listAdminCategories } from "@/features/admin/catalog/categories";
import { CategoryForm, DeleteCategory } from "@/features/admin/catalog/category-forms";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const rows = await listAdminCategories(getDb());
  return <main id="main-content" className="admin-catalog">
    <nav aria-label="Admin"><Link href="/admin">Dashboard</Link> / Categories</nav>
    <h1>Categories</h1>
    <p>All categories, including those with unpublished products. A category can be removed only while empty.</p>
    <CategoryForm />
    <div className="admin-category-grid">{rows.map((category) => <section className="admin-category-row" key={category.id}>
      <CategoryForm category={category} />
      <p>{category.productCount} product(s), including drafts.</p>
      <DeleteCategory category={category} />
    </section>)}</div>
  </main>;
}
