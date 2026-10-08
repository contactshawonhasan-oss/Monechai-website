import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/commerce/product";
import type { getCatalogProducts, getCatalogCategories } from "@/features/catalog/server";
import { getDictionary, localizedText, type Locale } from "@/i18n/dictionary";

type Categories = Awaited<ReturnType<typeof getCatalogCategories>>;
type Items = Awaited<ReturnType<typeof getCatalogProducts>>["items"];

export function Hero({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return <section className="hero"><div className="container hero-inner"><div>
    <p className="eyebrow">{t.heroEyebrow}</p>
    <h1>{t.heroTitle}<br /><span>{t.heroTitleSecond}</span></h1>
    <p>{t.heroText}</p>
    <Link className="button button-gold" href="/shop">{t.browseShop} <span aria-hidden="true">→</span></Link>
  </div><div className="hero-art" aria-hidden="true"><Image src="/monechai-logo.svg" alt="" width={468} height={83} unoptimized loading="eager" /></div></div></section>;
}

export function HowToOrder({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return <section className="section container" aria-labelledby="how-title"><div className="section-heading"><h2 id="how-title">{t.explore}</h2><p>{t.find}</p></div>
    <ol className="steps"><li><span>01</span><strong>{t.browseCategories}</strong><p>{t.browseCategoriesText}</p></li>
      <li><span>02</span><strong>{t.compareOptions}</strong><p>{t.compareOptionsText}</p></li>
      <li><span>03</span><strong>{t.checkDelivery}</strong><p>{t.checkDeliveryText}</p></li></ol>
  </section>;
}

export function CategoryGrid({ categories, locale }: { categories: Categories; locale: Locale }) {
  const t = getDictionary(locale);
  if (!categories.length) return null;
  return <section className="section container" aria-labelledby="category-title"><div className="section-heading"><h2 id="category-title">{t.byCategory}</h2><Link href="/shop">{t.seeAll} <span aria-hidden="true">→</span></Link></div>
    <div className="category-grid">{categories.map((category) => <Link key={category.id} className="category-tile" href={`/shop?category=${encodeURIComponent(category.slug)}`}><span aria-hidden="true">✦</span><strong>{localizedText(locale, category.nameEn, category.nameBn)}</strong><span aria-hidden="true">→</span></Link>)}</div>
  </section>;
}

export function ProductSection({ id, title, products, locale }: { id: string; title: string; products: Items; locale: Locale }) {
  if (!products.length) return null;
  return <section className="section container" aria-labelledby={id}><div className="section-heading"><h2 id={id}>{title}</h2><Link href="/shop">{getDictionary(locale).seeAll} <span aria-hidden="true">→</span></Link></div><ProductGrid products={products} locale={locale} /></section>;
}
