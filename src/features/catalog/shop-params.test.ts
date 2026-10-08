import { test } from "node:test";
import { strict as assert } from "node:assert";
import { parseShopParams, shopHref } from "./shop-params";

test("shop params validate hostile and repeated URL inputs", () => {
  assert.deepEqual(parseShopParams({ q: ["duplicate"], sort: "unknown", page: "-1", category: "../bad" }), { q: "", sort: "newest", page: 1, category: "" });
  assert.deepEqual(parseShopParams({ q: "  rc car  ", category: "rc-cars", sort: "price-asc", page: "2" }), { q: "rc car", category: "rc-cars", sort: "price-asc", page: 2 });
  assert.equal(parseShopParams({ page: "10000" }).page, 1);
});

test("pagination preserves encoded filters without retaining page 1", () => {
  const state = parseShopParams({ q: "a & b", category: "home-lighting", sort: "price-desc", page: "3" });
  assert.equal(shopHref(state, 1), "/shop?q=a+%26+b&category=home-lighting&sort=price-desc");
  assert.equal(shopHref(state, 4), "/shop?q=a+%26+b&category=home-lighting&sort=price-desc&page=4");
});
