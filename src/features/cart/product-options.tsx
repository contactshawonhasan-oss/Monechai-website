"use client";
import { useState } from "react";
import { addToCart } from "./storage";
import { formatBdt } from "@/lib/money";
import { getDictionary, type Locale } from "@/i18n/dictionary";

export function ProductOptions({ variants, basePrice, locale = "en" }: { variants: { id: string; label: string; available: boolean; priceMinor: number | null }[]; basePrice: number; locale?: Locale }) {
  const t = getDictionary(locale);
  const [selected, setSelected] = useState(variants.find((v) => v.available)?.id ?? "");
  const [added, setAdded] = useState(false);
  return <div className="product-options">
    <label htmlFor="product-variant">{t.chooseOption}</label>
    <select id="product-variant" value={selected} onChange={(e) => { setSelected(e.target.value); setAdded(false); }}>
      {variants.every((v) => !v.available) && <option value="">{t.unavailable}</option>}
      {variants.map((v) => <option key={v.id} value={v.id} disabled={!v.available}>{v.label} — {formatBdt(v.priceMinor ?? basePrice, locale === "bn" ? "bn-BD" : "en-BD")}{!v.available ? ` (${t.outOfStock})` : ""}</option>)}
    </select>
    <button type="button" className="button button-dark" disabled={!selected} onClick={() => { addToCart(selected); setAdded(true); }}>{added ? t.added : t.add}</button>
  </div>;
}
