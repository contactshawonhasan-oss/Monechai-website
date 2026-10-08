"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { readCart, saveCart, type CartItem } from "./storage";
import { formatBdt } from "@/lib/money";
import { getDictionary, type Locale } from "@/i18n/dictionary";

type Line = { variantId: string; name: string; label: string; available: boolean; unitPriceMinor: number | null };
export function CartDrawer({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  const currencyLocale = locale === "bn" ? "bn-BD" : "en-BD";
  const dialog = useRef<HTMLDialogElement>(null);
  const refreshId = useRef(0);
  const [items, setItems] = useState<CartItem[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState("");
  async function refresh(next: CartItem[]) {
    const current = ++refreshId.current;
    setItems(next); setLines([]); setError("");
    if (!next.length) return;
    try {
      const response = await fetch("/api/checkout/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: next, shippingZone: "inside-dhaka" }), cache: "no-store" });
      if (!response.ok) throw new Error(t.cartError);
      const data = await response.json();
      if (current === refreshId.current) setLines(data.lines);
    } catch { if (current === refreshId.current) setError(t.cartError); }
  }
  function update(next: CartItem[]) {
    if (next.length) saveCart(next);
    else { localStorage.removeItem("monechai:cart:v1"); window.dispatchEvent(new Event("monechai:cart-change")); }
    void refresh(next);
  }
  return <>
    <button type="button" className="cart-trigger" onClick={() => { dialog.current?.showModal(); void refresh(readCart()); }}>{t.cart}</button>
    <dialog ref={dialog} className="cart-drawer" aria-label={t.yourCart} onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}>
      <div className="drawer-header"><h2>{t.yourCart}</h2><button type="button" onClick={() => dialog.current?.close()} aria-label={t.closeCart}>✕</button></div>
      {!items.length ? <p>{t.emptyCart}</p> : <>
        {items.map((item) => {
          const line = lines.find((entry) => entry.variantId === item.variantId);
          return <div className="cart-line" key={item.variantId}>
            <div><strong>{line?.name ?? t.checkingItem}</strong><p>{line?.label}</p>{line && <p>{line.available ? formatBdt(line.unitPriceMinor!, currencyLocale) : t.unavailable}</p>}</div>
            <label>{t.quantity} <input type="number" min="1" max="20" value={item.quantity} onChange={(e) => { const quantity = Number(e.target.value); if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 20) update(items.map((entry) => entry.variantId === item.variantId ? { ...entry, quantity } : entry)); }} /></label>
            <button type="button" onClick={() => update(items.filter((entry) => entry.variantId !== item.variantId))}>{t.remove}</button>
          </div>;
        })}
        {error && <p role="alert">{error}</p>}
        <p>{t.finalCheck}</p>
        <Link href="/checkout" className="button button-dark" onClick={() => dialog.current?.close()}>{t.proceed}</Link>
      </>}
    </dialog>
  </>;
}
