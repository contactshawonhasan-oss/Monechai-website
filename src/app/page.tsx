import { connection } from "next/server";
import { CategoryGrid, Hero, HowToOrder, ProductSection } from "@/components/blocks/home";
import { getCatalogCategories, getCatalogProducts } from "@/features/catalog/server";
import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionary";

export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { url: "/" } };

export default async function Home() {
  await connection(); // Never bake the catalog into the production build.
  const locale = await getLocale();
  const t = getDictionary(locale);
  const [categories, featured, latest] = await Promise.all([
    getCatalogCategories(), getCatalogProducts({ featured: true, pageSize: 4 }), getCatalogProducts({ pageSize: 8 }),
  ]);
  return <>
    <Hero locale={locale} />
    <HowToOrder locale={locale} />
    <CategoryGrid categories={categories} locale={locale} />
    <ProductSection id="featured-title" title={t.featured} products={featured.items} locale={locale} />
    <ProductSection id="latest-title" title={t.exploreProducts} products={latest.items} locale={locale} />
    {!latest.total && <section className="section container empty-state"><h2>{t.comingSoon}</h2><p>{t.comingSoonText}</p></section>}
  </>;
}
