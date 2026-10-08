import type { Metadata } from "next";
import "./globals.css";
import { StoreShell } from "@/components/layout/store-shell";
import { siteOrigin } from "@/lib/site-url";
import { getLocale } from "@/i18n/server";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin() ?? "http://localhost:3000"),
  title: { default: "Monechai | Shop Smart • Live Better", template: "%s | Monechai" },
  description: "Browse Monechai products and check Cash on Delivery availability at checkout.",
  openGraph: { type: "website", siteName: "Monechai", title: "Monechai", description: "Browse products and check Cash on Delivery availability at checkout." },
  robots: siteOrigin()?.startsWith("https://") ? undefined : { index: false, follow: false },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body><StoreShell locale={locale}>{children}</StoreShell></body>
    </html>
  );
}
