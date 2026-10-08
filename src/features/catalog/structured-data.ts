import { productImageUrl } from "./images";

type ProductData = {
  slug: string; nameEn: string; descriptionEn: string | null; sku?: string;
  priceMinor: number; variants: { available: boolean }[];
  images: { storageKey: string | null }[];
};

export function productStructuredData(product: ProductData, origin: string) {
  const image = productImageUrl(product.images[0]?.storageKey);
  return {
    "@context": "https://schema.org", "@type": "Product", name: product.nameEn,
    description: product.descriptionEn || undefined,
    image: image ? [image] : undefined,
    sku: product.sku || undefined,
    offers: {
      "@type": "Offer", url: `${origin}/products/${product.slug}`,
      priceCurrency: "BDT", price: (product.priceMinor / 100).toFixed(2),
      availability: product.variants.some((variant) => variant.available) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

/** JSON in a script element must not let catalog text close the element. */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
