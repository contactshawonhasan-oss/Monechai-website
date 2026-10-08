import assert from "node:assert/strict";
import { test } from "node:test";
import { allowCheckoutAttempt, checkoutRateKey, readLimitedBody } from "./abuse";
import { checkoutSchema } from "./domain";

test("checkout body cap counts UTF-8 bytes, including streamed bodies", async () => {
  assert.equal(await readLimitedBody(new Request("http://localhost", { method: "POST", body: "éé" }), 3), null);
  assert.equal(await readLimitedBody(new Request("http://localhost", { method: "POST", body: "éé" }), 4), "éé");
});

test("honeypot rejects filled field", () => {
  const base = { idempotencyKey: "b8ed24e6-d07c-45a8-9c9d-5aa5841ce19e", items: [{ variantId: "c3043646-c5ea-4516-96e1-78581323dcb4", quantity: 1 }], customerName: "Test Person", phone: "01712345678", address: "123 Example Street", area: "Dhaka", shippingZone: "inside-dhaka", paymentMethod: "cod" };
  assert.equal(checkoutSchema.safeParse({ ...base, website: "" }).success, true);
  assert.equal(checkoutSchema.safeParse({ ...base, website: "spam" }).success, false);
});

test("checkout throttle has a fixed window and trusts proxy header only when configured", () => {
  const key = "test-rate-" + crypto.randomUUID();
  for (let i = 0; i < 10; i++) assert.equal(allowCheckoutAttempt(key, 1000), true);
  assert.equal(allowCheckoutAttempt(key, 1000), false);
  assert.equal(allowCheckoutAttempt(key, 601001), true);
  const previous = process.env.CHECKOUT_TRUST_PROXY_IP_HEADER;
  try {
    delete process.env.CHECKOUT_TRUST_PROXY_IP_HEADER;
    assert.equal(checkoutRateKey(new Request("http://localhost", { headers: { "x-real-ip": "192.0.2.1" } })), "unidentified");
    process.env.CHECKOUT_TRUST_PROXY_IP_HEADER = "true";
    assert.equal(checkoutRateKey(new Request("http://localhost", { headers: { "x-real-ip": "192.0.2.1" } })), "ip:192.0.2.1");
    assert.equal(checkoutRateKey(new Request("http://localhost", { headers: { "x-real-ip": "192.0.2.1, 8.8.8.8" } })), "unidentified");
  } finally { if (previous === undefined) delete process.env.CHECKOUT_TRUST_PROXY_IP_HEADER; else process.env.CHECKOUT_TRUST_PROXY_IP_HEADER = previous; }
});
