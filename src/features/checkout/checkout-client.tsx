"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { readCart, saveCart, type CartItem } from "@/features/cart/storage";
import { formatBdt } from "@/lib/money";
import { getDictionary, type Locale } from "@/i18n/dictionary";

type Preview = { lines: { variantId: string; name: string; label: string; quantity: number; unitPriceMinor: number | null; available: boolean }[];
  zoneConfigured: boolean; zoneName: string | null; paymentAvailable: boolean; totals: { subtotalMinor: number; shippingMinor: number; totalMinor: number } | null };

async function postJson(path: string, data: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw Object.assign(new Error(body.error ?? "Service unavailable"), { code: typeof body.code === "string" ? body.code : undefined });
  return body;
}

function checkoutMessage(error: unknown, locale: Locale): string {
  const t = getDictionary(locale);
  if (locale === "en") return error instanceof Error ? error.message : t.checkoutError;
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "OUT_OF_STOCK") return t.insufficientStock;
  if (code === "UNAVAILABLE") return t.itemUnavailable;
  if (code === "SHIPPING_NOT_CONFIGURED") return t.shippingUnavailable;
  if (code === "KEY_REUSED") return t.retryCheckout;
  return t.checkoutError;
}

export function CheckoutClient({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  const currencyLocale = locale === "bn" ? "bn-BD" : "en-BD";
  const router = useRouter();
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [zone, setZone] = useState<"inside-dhaka" | "outside-dhaka">("inside-dhaka");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const [placing, setPlacing] = useState(false);
  const retryKey = useRef<string | null>(null);
  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener("monechai:cart-change", sync);
    return () => window.removeEventListener("monechai:cart-change", sync);
  }, []);
  useEffect(() => {
    if (!items?.length) return;
    let cancelled = false;
    postJson("/api/checkout/preview", { items, shippingZone: zone })
      .then((data: Preview) => { if (!cancelled) { setPreview(data); setMessage(""); } })
      .catch((error: Error) => { if (!cancelled) { setPreview(null); setMessage(checkoutMessage(error, locale)); } });
    return () => { cancelled = true; };
  }, [items, zone, locale]);
  function update(next: CartItem[]) {
    retryKey.current = null;
    setPreview(null);
    if (!next.length) { localStorage.removeItem("monechai:cart:v1"); window.dispatchEvent(new Event("monechai:cart-change")); }
    else saveCart(next);
  }
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items?.length || !preview?.totals || placing) return;
    setPlacing(true); setMessage("");
    try {
      retryKey.current ??= crypto.randomUUID();
      const fields = new FormData(event.currentTarget);
      const result = await postJson("/api/checkout", {
        idempotencyKey: retryKey.current, items, shippingZone: zone, paymentMethod: "cod",
        website: fields.get("website"),
        customerName: fields.get("name"), phone: fields.get("phone"), address: fields.get("address"), area: fields.get("area"), note: fields.get("note"),
      });
      localStorage.removeItem("monechai:cart:v1");
      router.push(`/order/${result.publicToken}/success`);
    } catch (error) {
      setMessage(checkoutMessage(error, locale));
      setPlacing(false);
    }
  }
  if (!items) return <p>{t.loadingCart}</p>;
  if (!items.length) return <div className="empty-state"><h2>{t.emptyCart}</h2><Link className="button button-dark" href="/shop">{t.browseProducts}</Link></div>;
  return <div className="checkout-grid">
    <section aria-label={t.yourItems}><h2>{t.yourItems}</h2>
      {items.map((item) => {
        const line = preview?.lines.find((l) => l.variantId === item.variantId);
        return <div className="cart-line" key={item.variantId}>
          <div><strong>{line?.name ?? t.checkingItem}</strong><p>{line?.label}</p>{line && (!line.available ? <p role="alert">{t.removeOrReduce}</p> : <p>{formatBdt(line.unitPriceMinor!, currencyLocale)} {t.each}</p>)}</div>
          <label>{t.quantity} <input type="number" min="1" max="20" value={item.quantity} onChange={(e) => { const value = Number(e.target.value); if (Number.isInteger(value) && value >= 1 && value <= 20) update(items.map((l) => l.variantId === item.variantId ? { ...l, quantity: value } : l)); }} /></label>
          <button type="button" onClick={() => update(items.filter((l) => l.variantId !== item.variantId))}>{t.remove}</button>
        </div>;
      })}
      <label htmlFor="shipping-zone">{t.deliveryArea}</label>
      <select id="shipping-zone" value={zone} onChange={(e) => { retryKey.current = null; setPreview(null); setZone(e.target.value as typeof zone); }}><option value="inside-dhaka">{t.insideDhaka}</option><option value="outside-dhaka">{t.outsideDhaka}</option></select>
      {preview?.totals ? <div className="order-summary"><p>{t.subtotal}: {formatBdt(preview.totals.subtotalMinor, currencyLocale)}</p><p>{t.delivery}: {formatBdt(preview.totals.shippingMinor, currencyLocale)}</p><strong>{t.estimatedTotal}: {formatBdt(preview.totals.totalMinor, currencyLocale)}</strong></div> : <p>{preview && !preview.paymentAvailable ? t.codOff : preview && !preview.zoneConfigured ? t.areaFeesMissing : t.reviewItems}</p>}
    </section>
    <form onSubmit={submit} onChange={() => { retryKey.current = null; }} className="checkout-form"><h2>{t.deliveryDetails}</h2>
      <div className="checkout-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label>{t.fullName}<input name="name" required minLength={2} maxLength={120} autoComplete="name" /></label>
      <label>{t.mobile}<input name="phone" required type="tel" maxLength={40} autoComplete="tel" placeholder="01712345678" /></label>
      <label>{t.street}<input name="address" required minLength={10} maxLength={500} autoComplete="street-address" /></label>
      <label>{t.area}<input name="area" required minLength={2} maxLength={120} /></label>
      <label>{t.note}<textarea name="note" maxLength={500} /></label>
      <p>{t.paymentCod}</p>
      {message && <p role="alert" className="checkout-error">{message}</p>}
      <button type="submit" className="button button-dark" disabled={!preview?.totals || placing}>{placing ? t.placing : t.placeOrder}</button>
    </form>
  </div>;
}
