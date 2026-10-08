import { CheckoutClient } from "@/features/checkout/checkout-client";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionary";
export const metadata = { title: "Checkout", robots: { index: false, follow: false } };
export default async function CheckoutPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return <div className="container checkout-page"><h1>{t.checkoutTitle}</h1><p>{t.checkoutIntro}</p><CheckoutClient locale={locale} /></div>;
}
