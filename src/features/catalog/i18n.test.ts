import assert from "node:assert/strict";
import { test } from "node:test";
import { getDictionary, localizedText } from "@/i18n/dictionary";
import { supportEmailHref, whatsappHref } from "@/lib/contact-links";

test("Bangla catalog fields fall back to English only when no translation exists", () => {
  assert.equal(localizedText("bn", "Shirt", "শার্ট"), "শার্ট");
  assert.equal(localizedText("bn", "Shirt", "  "), "Shirt");
  assert.equal(localizedText("en", "Shirt", "শার্ট"), "Shirt");
  assert.equal(getDictionary("bn").shopTitle, "পণ্য দেখুন");
});

test("contact links validate owner settings and encode optional text", () => {
  assert.equal(whatsappHref("8801712345678", "Order MC-1 & details"), "https://wa.me/8801712345678?text=Order+MC-1+%26+details");
  assert.equal(whatsappHref("javascript:alert(1)"), null);
  assert.equal(supportEmailHref("help@example.com"), "mailto:help%40example.com");
  assert.equal(supportEmailHref("evil@example.com?subject=spam"), null);
});
