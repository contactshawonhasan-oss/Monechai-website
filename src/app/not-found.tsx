import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionary";
export default async function NotFound() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return <div className="container empty-state page-message"><h1>{locale === "bn" ? "পাতা পাওয়া যায়নি" : "Page not found"}</h1><p>{locale === "bn" ? "এই পাতা বা পণ্যটি পাওয়া যাচ্ছে না।" : "This page or product is not available."}</p><Link className="button button-gold" href="/shop">{t.browseProducts}</Link></div>;
}
