import Link from "next/link";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/features/admin/auth";
import { getSettings } from "@/features/admin/settings";
import { SiteSettingsForm, ZoneForm } from "@/features/admin/settings-forms";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const { settings, zones } = await getSettings(getDb());
  if (!settings) throw new Error("Missing site settings row; run database migrations.");
  return <main id="main-content" className="admin-catalog">
    <nav aria-label="Admin"><Link href="/admin">Dashboard</Link> / Settings</nav>
    <h1>Settings</h1>
    <SiteSettingsForm settings={settings} />
    <h2>Delivery fees</h2><p>Changes apply to new checkouts only. Never replace verified rates with guesses; past orders retain their snapshots.</p>
    <ZoneForm code="inside-dhaka" zone={zones.find((z) => z.code === "inside-dhaka")} />
    <ZoneForm code="outside-dhaka" zone={zones.find((z) => z.code === "outside-dhaka")} />
  </main>;
}
