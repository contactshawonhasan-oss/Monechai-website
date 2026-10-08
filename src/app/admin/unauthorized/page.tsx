import Link from "next/link";

export default function UnauthorizedPage() {
  return <main id="main-content" className="admin-panel">
    <h1>Access denied</h1>
    <p>This account is not authorized to manage the store. Contact the store owner.</p>
    <Link href="/admin/login">Return to sign in</Link>
  </main>;
}
