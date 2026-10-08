import { test } from "node:test";
import { strict as assert } from "node:assert";
import { cartSchema, checkoutSchema, calculateTotals, normalizeBdPhone } from "./domain";

const id = "c115329a-65da-48f2-8020-90051870520f";
test("Bangladesh phone normalization rejects non-mobile and foreign numbers", () => {
  for (const number of ["01712345678", "8801712345678", "+880 1712-345678"]) assert.equal(normalizeBdPhone(number), "+8801712345678");
  for (const number of ["018123", "+12025550100", "01112345678", "017123456789"]) assert.throws(() => normalizeBdPhone(number));
});
test("server rejects tampered checkout fields, duplicates and unsafe quantities", () => {
  const valid = { idempotencyKey: id, items: [{ variantId: id, quantity: 1 }], customerName: "A Customer", phone: "01712345678", address: "House 12, Dhaka", area: "Mirpur", shippingZone: "inside-dhaka", paymentMethod: "cod" };
  assert.equal(checkoutSchema.parse(valid).phone, "+8801712345678");
  for (const extra of [{ totalMinor: 1 }, { paymentStatus: "paid" }, { paymentMethod: "bkash" }]) assert.equal(checkoutSchema.safeParse({ ...valid, ...extra }).success, false);
  assert.equal(cartSchema.safeParse([{ variantId: id, quantity: 1 }, { variantId: id, quantity: 1 }]).success, false);
  assert.equal(cartSchema.safeParse([{ variantId: id, quantity: 21 }]).success, false);
});
test("integer-money shipping threshold is inclusive and validates configuration", () => {
  assert.deepEqual(calculateTotals([{ unitPriceMinor: 4999, quantity: 2 }], { feeMinor: 6000, freeAboveMinor: 9998 }), { subtotalMinor: 9998, shippingMinor: 0, discountMinor: 0, totalMinor: 9998 });
  assert.equal(calculateTotals([{ unitPriceMinor: 4999, quantity: 2 }], { feeMinor: 6000, freeAboveMinor: 9999 }).totalMinor, 15998);
  assert.equal(calculateTotals([{ unitPriceMinor: 4999, quantity: 2 }], { feeMinor: 6000, freeAboveMinor: null }).totalMinor, 15998);
  for (const fee of [-1, 1.5, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => calculateTotals([{ unitPriceMinor: 1, quantity: 1 }], { feeMinor: fee, freeAboveMinor: null }));
  }
  for (const threshold of [0, -1, 1.5]) {
    assert.throws(() => calculateTotals([{ unitPriceMinor: 1, quantity: 1 }], { feeMinor: 1, freeAboveMinor: threshold }));
  }
  assert.throws(() => calculateTotals([{ unitPriceMinor: 2147483647, quantity: 1 }], { feeMinor: 1, freeAboveMinor: null }), RangeError);
});
test("checkout schema rejects poisoned or excessive carts and bot fields", () => {
  const base = { idempotencyKey: id, items: [{ variantId: id, quantity: 1 }], customerName: "Test", phone: "01712345678", address: "House 12 Test Road", area: "Dhaka", shippingZone: "inside-dhaka", paymentMethod: "cod" };
  for (const change of [
    { website: "spam.example" }, { customerName: "x" }, { address: "short" }, { area: "" },
    { items: [{ variantId: id, quantity: 0 }] },
    { items: Array.from({ length: 31 }, () => ({ variantId: crypto.randomUUID(), quantity: 1 })) },
    { items: Array.from({ length: 6 }, () => ({ variantId: crypto.randomUUID(), quantity: 20 })) },
    { shippingZone: "unconfigured" },
  ]) assert.equal(checkoutSchema.safeParse({ ...base, ...change }).success, false);
});
