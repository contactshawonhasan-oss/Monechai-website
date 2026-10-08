import assert from "node:assert/strict";
import { test } from "node:test";
import { productStructuredData, safeJsonLd } from "./structured-data";
import { publicSiteOrigin, siteOrigin } from "@/lib/site-url";

test("only a clean HTTPS production origin is published", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
    assert.equal(siteOrigin(), "https://example.com");
    assert.equal(publicSiteOrigin(), "https://example.com");
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    assert.equal(publicSiteOrigin(), null);
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/path";
    assert.equal(siteOrigin(), null);
  } finally { if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = previous; }
});

test("Product JSON-LD uses real price and stock without fabricated reviews", () => {
  const data = productStructuredData({ slug: "test-item", nameEn: "</script><script>alert(1)</script>", descriptionEn: null, priceMinor: 12345, variants: [{ available: false }], images: [] }, "https://example.com");
  const json = safeJsonLd(data);
  assert.equal(json.includes("</script>"), false);
  assert.equal(JSON.parse(json).offers.price, "123.45");
  assert.equal(JSON.parse(json).offers.availability, "https://schema.org/OutOfStock");
  assert.equal(json.includes("aggregateRating"), false);
});
