import Link from "next/link";
import { ProductGrid } from "@/components/commerce/product";
import { getCatalogCategories, getCatalogProducts } from "@/features/catalog/server";
import { parseShopParams, shopHref, type ShopParams } from "@/features/catalog/shop-params";
import { getLocale } from "@/i18n/server";
import { getDictionary, localizedText } from "@/i18n/dictionary";

export const metadata = { title: "Shop", description: "Browse the Monechai catalog.", alternates: { canonical: "/shop" }, openGraph: { url: "/shop", title: "Shop Monechai" } };

export default async function Shop({ searchParams }: { searchParams: Promise<ShopParams> }) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const state = parseShopParams(await searchParams);
  const [categories, result] = await Promise.all([
    getCatalogCategories(), getCatalogProducts({ search: state.q || undefined, category: state.category || undefined, sort: state.sort, page: state.page }),
  ]);
  const pages = Math.ceil(result.total / result.pageSize);
  return <div className="container shop-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">{t.home}</Link><span aria-hidden="true"> / </span>{t.shop}</nav>
    <h1>{t.shopTitle}</h1>
    <p>{t.shopIntro}</p>
    <form className="shop-filters" action="/shop" method="get" role="search">
      <div><label htmlFor="shop-q">{t.searchProducts}</label><input id="shop-q" type="search" name="q" defaultValue={state.q} maxLength={100} placeholder={t.searchProducts} /></div>
      <div><label htmlFor="shop-category">{t.category}</label><select id="shop-category" name="category" defaultValue={state.category}>
        <option value="">{t.allCategories}</option>{categories.map((category) => <option key={category.id} value={category.slug}>{localizedText(locale, category.nameEn, category.nameBn)}</option>)}
        {state.category && !categories.some((c) => c.slug === state.category) && <option value={state.category}>{t.unknownCategory}</option>}
      </select></div>
      <div><label htmlFor="shop-sort">{t.sort}</label><select id="shop-sort" name="sort" defaultValue={state.sort}>
        <option value="newest">{t.newest}</option><option value="price-asc">{t.lowHigh}</option><option value="price-desc">{t.highLow}</option>
      </select></div>
      <button className="button button-gold" type="submit">{t.filters}</button>
    </form>
    <div className="shop-count" role="status">{new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD").format(result.total)} {t.found}</div>
    {result.items.length ? <ProductGrid products={result.items} locale={locale} /> : <div className="empty-state"><h2>{result.total ? t.noPage : t.noResults}</h2><p>{state.q || state.category ? t.tryAnother : t.publishedHere}</p><Link className="button button-dark" href="/shop">{t.browseAll}</Link></div>}
    {pages > 1 && <nav className="pagination" aria-label="Product pages">
      {state.page > 1 && <Link href={shopHref(state, state.page - 1)} rel="prev">← {t.previous}</Link>}
      <span>{t.page} {state.page} {t.of} {pages}</span>
      {state.page < pages && <Link href={shopHref(state, state.page + 1)} rel="next">{t.next} →</Link>}
    </nav>}
  </div>;
}
