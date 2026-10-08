import { test, expect } from "@playwright/test";
import postgres from "postgres";

const databaseUrl = process.env.TEST_DATABASE_URL;
test("responsive bilingual storefront and keyboard COD checkout reject invalid/stock changes before real success", async ({ page }) => {
  const sql = postgres(databaseUrl!, { ssl: process.env.DATABASE_SSL === "disable" || !process.env.DATABASE_SSL ? false : "require", max: 2 });
  const slug = `test-${crypto.randomUUID()}`;
  const categorySlug = `test-${crypto.randomUUID()}`;
  let categoryId = "", productId = "", variantId = "", token = "";
  try {
    [{ id: categoryId }] = await sql`insert into categories (slug,name_en) values (${categorySlug}, 'Fixture') returning id`;
    [{ id: productId }] = await sql`insert into products (slug, sku, category_id, name_en, price_minor, is_published) values (${slug}, ${crypto.randomUUID()}, ${categoryId}, 'Keyboard fixture', 12500, true) returning id`;
    [{ id: variantId }] = await sql`insert into product_variants (product_id, sku, stock_quantity) values (${productId}, ${crypto.randomUUID()}, 1) returning id`;
    const existing = await sql`select code from shipping_zones where code='inside-dhaka'`;
    expect(existing).toHaveLength(0); // Never replace real rates on an existing DB.
    await sql`insert into shipping_zones (code,name,fee_minor) values ('inside-dhaka','Test-only delivery',6500)`;

    // Exercise the actual server-rendered home/shop/product at mobile, tablet and desktop widths.
    for (const width of [390, 800, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toContainText("Shop Smart");
      await expect(page.locator(".site-footer")).toBeAttached();
      await page.goto(`/shop?category=${categorySlug}`);
      await expect(page.getByRole("link", { name: "View details: Keyboard fixture" })).toBeVisible();
      await page.goto(`/products/${slug}`);
      await expect(page.getByRole("heading", { name: "Keyboard fixture" })).toBeVisible();
      // No layout may silently push critical controls off the viewport.
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    }
    await page.goto("/");
    await page.getByRole("combobox", { name: "Language / ভাষা" }).selectOption("bn");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("সহজে কিনুন");
    await page.goto(`/shop?category=${categorySlug}`);
    await expect(page.getByRole("heading", { name: "পণ্য দেখুন" })).toBeVisible();
    await page.goto(`/products/${slug}`);
    await expect(page.getByRole("heading", { name: "Keyboard fixture" })).toBeVisible(); // fallback when name_bn is unset
    await page.getByRole("combobox", { name: "Language / ভাষা" }).selectOption("en");
    await expect(page.getByRole("heading", { name: "Keyboard fixture" })).toBeVisible();
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveClass(/skip-link/);
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveClass(/brand/);
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveAttribute("id", "header-q");
    await page.getByRole("link", { name: "Shop", exact: true }).click();
    await page.getByLabel("Search products").last().fill("Keyboard fixture");
    await page.getByRole("button", { name: "Apply filters" }).press("Enter");
    await expect(page.getByText("1 products found")).toBeVisible();
    await page.getByLabel("Search products").last().focus();
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveAttribute("id", "shop-category");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveAttribute("id", "shop-sort");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveText("Apply filters");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/sort=price-asc/);
    await page.getByRole("link", { name: "View details: Keyboard fixture" }).click();
    await expect(page.getByRole("heading", { name: "Keyboard fixture" })).toBeVisible();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.getByRole("button", { name: "Cart", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Your cart" })).toBeVisible();
    await page.getByRole("link", { name: "Proceed to checkout" }).click();
    await expect(page.getByText("Test-only delivery")).not.toBeVisible(); // Only totals, no fabricated shipping claim.
    await expect(page.getByText(/Estimated total:/)).toContainText("190.00");
    await page.getByLabel("Full name").fill("Test Customer");
    await page.getByLabel("Bangladesh mobile number").fill("123");
    await page.getByLabel("Street address").fill("House 12 Test Road");
    await page.getByLabel("Area", { exact: true }).fill("Mirpur");
    await page.getByRole("button", { name: "Place COD order" }).click();
    await expect(page.locator(".checkout-error")).toContainText("Invalid checkout details");
    expect(await sql`select id from orders where shipping_zone_code='inside-dhaka'`).toHaveLength(0);
    await page.getByLabel("Bangladesh mobile number").fill("01712345678");
    // A forged client total/payment flag must not be accepted; missing variants cannot create orders.
    const checkoutInput = { idempotencyKey: crypto.randomUUID(), items: [{ variantId, quantity: 1 }],
      customerName: "Test Customer", phone: "01712345678", address: "House 12 Test Road", area: "Mirpur",
      shippingZone: "inside-dhaka", paymentMethod: "cod" };
    const headers = { origin: "http://127.0.0.1:3104" };
    for (const forged of [{ totalMinor: 1 }, { paymentStatus: "paid" }, { paymentMethod: "bkash" }]) {
      const response = await page.request.post("/api/checkout", { headers, data: { ...checkoutInput, ...forged } });
      expect(response.status()).toBe(400);
    }
    const unavailable = await page.request.post("/api/checkout", { headers, data: { ...checkoutInput, items: [{ variantId: crypto.randomUUID(), quantity: 1 }] } });
    expect(unavailable.status()).toBe(409);
    expect((await unavailable.json()).code).toBe("UNAVAILABLE");
    expect(await sql`select id from orders where shipping_zone_code='inside-dhaka'`).toHaveLength(0);
    await sql`update product_variants set stock_quantity=0 where id=${variantId}`;
    await page.getByRole("button", { name: "Place COD order" }).click();
    await expect(page.locator(".checkout-error")).toContainText("insufficient stock");
    expect(await sql`select id from orders where shipping_zone_code='inside-dhaka'`).toHaveLength(0);
    await sql`update product_variants set stock_quantity=1 where id=${variantId}`;
    await page.getByRole("button", { name: "Place COD order" }).click();
    await expect(page).toHaveURL(/\/order\/[0-9a-f]{64}\/success$/);
    token = page.url().split("/").at(-2)!;
    await expect(page.getByRole("heading", { name: "Order received" })).toBeVisible();
    await expect(page.getByText(/Total including delivery:/)).toContainText("190.00");
    const saved = await sql`select o.total_minor, o.phone, i.unit_price_minor, i.quantity from orders o join order_items i on i.order_id=o.id where o.public_token=${token}`;
    expect(saved).toMatchObject([{ total_minor: 19000, phone: "+8801712345678", unit_price_minor: 12500, quantity: 1 }]);
    expect((await sql`select stock_quantity from product_variants where id=${variantId}`)[0].stock_quantity).toBe(0);
    for (let i = 0; i < 12; i++) {
      await sql`insert into products (slug, sku, category_id, name_en, price_minor, is_published) values (${`fixture-${crypto.randomUUID()}`}, ${crypto.randomUUID()}, ${categoryId}, ${`Pagination ${i}`}, 10000, true)`;
    }
    await page.goto(`/shop?category=${categorySlug}`);
    await expect(page.getByText("Page 1 of 2")).toBeVisible();
    await page.locator(".product-card a").last().focus();
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toContainText("Next");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Page 2 of 2")).toBeVisible();
  } finally {
    if (variantId) {
      const created = await sql`select distinct order_id from order_items where variant_id=${variantId}`;
      await sql`delete from order_items where variant_id=${variantId}`;
      for (const row of created) {
        await sql`delete from order_status_history where order_id=${row.order_id}`;
        await sql`delete from orders where id=${row.order_id}`;
      }
    }
    if (variantId) await sql`delete from product_variants where id=${variantId}`;
    if (categoryId) await sql`delete from products where category_id=${categoryId}`;
    if (categoryId) await sql`delete from categories where id=${categoryId}`;
    await sql`delete from shipping_zones where code='inside-dhaka' and name='Test-only delivery'`;
    await sql.end();
  }
});
