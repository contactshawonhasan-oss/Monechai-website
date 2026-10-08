import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import { formatBdt } from "@/lib/money";
import { getLocale } from "@/i18n/server";
import { getDictionary, orderStatusLabel } from "@/i18n/dictionary";

export const metadata = { title: "Order received", robots: { index: false, follow: false } };
export default async function OrderSuccess({ params }: { params: Promise<{ publicToken: string }> }) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { publicToken } = await params;
  if (!/^[0-9a-f]{64}$/.test(publicToken)) notFound();
  const [order] = await getDb().select({ orderNumber: orders.orderNumber, totalMinor: orders.totalMinor, status: orders.status })
    .from(orders).where(eq(orders.publicToken, publicToken)).limit(1);
  if (!order) notFound();
  return <div className="container success-page"><h1>{t.orderReceived}</h1><p>{t.orderSaved}</p>
    <p>{t.reference}: <strong>{order.orderNumber}</strong></p><p>{t.totalDelivery}: <strong>{formatBdt(order.totalMinor, locale === "bn" ? "bn-BD" : "en-BD")}</strong></p>
    <p>{t.status}: {orderStatusLabel(locale, order.status)}</p><p>{t.privateLink}</p>
    <Link className="button button-dark" href="/shop">{t.continueShopping}</Link>
  </div>;
}
