import { loginAdmin } from "@/features/admin/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main id="main-content" className="admin-panel">
    <h1>Admin sign in</h1>
    <p>For authorized store staff only. There is no public admin registration.</p>
    {error === "invalid" && <p role="alert">Unable to sign in. Check your credentials and try again.</p>}
    {error === "config" && <p role="alert">Admin sign in is not configured yet. Contact the store owner.</p>}
    <form action={loginAdmin} className="admin-form">
      <label>Email<input name="email" type="email" autoComplete="username" required maxLength={254} /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      <button className="button button-gold" type="submit">Sign in</button>
    </form>
  </main>;
}
