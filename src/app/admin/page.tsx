import Link from "next/link";
import { requireAdmin } from "@/features/admin/auth";
import { logoutAdmin } from "@/features/admin/actions";

export default async function AdminPage() {
  const admin = await requireAdmin();
  return <main id="main-content" className="admin-panel">
    <h1>Admin dashboard</h1>
    <p>Signed in as {admin.email ?? "admin"}.</p>
    <p><Link href="/admin/orders">Manage orders</Link> · <Link href="/admin/categories">Manage categories</Link> · <Link href="/admin/products">Manage products</Link> · <Link href="/admin/settings">Store settings</Link></p>
    <p>Photo uploads are still in progress. Configure verified contact details and shipping fees before live checkout.</p>
    <form action={logoutAdmin}><button className="button button-dark" type="submit">Sign out</button></form>
  </main>;
}
