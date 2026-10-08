"use client";

import { useActionState } from "react";
import { archiveProductAction, saveProductAction, saveVariantAction, type ProductState } from "./product-actions";

const initial: ProductState = { message: "" };
const amount = (minor: number | null | undefined) => minor == null ? "" : (minor / 100).toFixed(2);
type Product = { id: string; slug: string; sku: string; categoryId: string; nameEn: string; nameBn: string | null;
  descriptionEn: string | null; descriptionBn: string | null; priceMinor: number; compareAtMinor: number | null;
  isPublished: boolean; isFeatured: boolean; isDemo: boolean };
type Variant = { id: string; sku: string; label: string; attributes: Record<string, string>; priceMinor: number | null;
  trackInventory: boolean; stockQuantity: number | null; isActive: boolean };

export function ProductForm({ product, categories }: { product?: Product; categories: { id: string; nameEn: string }[] }) {
  const [state, action, pending] = useActionState(saveProductAction.bind(null, product?.id ?? null), initial);
  return <form action={action} className="admin-form admin-card">
    <h2>{product ? "Edit product" : "New draft product"}</h2>
    <p>BDT prices accept up to two decimal places; stored as integer poisha. Drafts are not shown in the store.</p>
    <label>Slug <input name="slug" required maxLength={150} defaultValue={product?.slug} /></label>
    <label>Product SKU <input name="sku" required maxLength={100} defaultValue={product?.sku} /></label>
    <label>Category <select name="categoryId" required defaultValue={product?.categoryId ?? ""}>
      <option value="" disabled>Select a category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
    </select></label>
    <label>English name <input name="nameEn" required maxLength={200} defaultValue={product?.nameEn} /></label>
    <label>Bangla name (optional) <input name="nameBn" maxLength={200} defaultValue={product?.nameBn ?? ""} /></label>
    <label>English description <textarea name="descriptionEn" maxLength={10000} rows={4} defaultValue={product?.descriptionEn ?? ""} /></label>
    <label>Bangla description <textarea name="descriptionBn" maxLength={10000} rows={4} defaultValue={product?.descriptionBn ?? ""} /></label>
    <label>Price (BDT) <input name="priceMinor" inputMode="decimal" required defaultValue={amount(product?.priceMinor)} /></label>
    <label>Compare-at price (BDT, optional) <input name="compareAtMinor" inputMode="decimal" defaultValue={amount(product?.compareAtMinor)} /></label>
    {!product && <fieldset><legend>First variant (inventory)</legend>
      <label>Variant SKU <input name="variantSku" required maxLength={100} /></label>
      <label>Variant label <input name="variantLabel" required maxLength={150} defaultValue="Default" /></label>
      <label>Stock quantity <input name="stockQuantity" required type="number" min="0" step="1" defaultValue="0" /></label>
    </fieldset>}
    <label className="admin-check"><input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} /> Featured</label>
    {product && <label className="admin-check"><input type="checkbox" name="isPublished" defaultChecked={product.isPublished} /> Published (requires an uploaded primary photo; demos cannot publish)</label>}
    <button type="submit" className="button button-dark" disabled={pending || !categories.length}>{pending ? "Saving…" : "Save product"}</button>
    <p role="status" aria-live="polite" className={state.message && state.message !== "Product saved." ? "checkout-error" : ""}>{state.message}</p>
    {state.errors && <ul className="checkout-error">{Object.entries(state.errors).map(([field, errors]) => <li key={field}>{field}: {errors.join(", ")}</li>)}</ul>}
  </form>;
}

export function VariantForm({ productId, variant }: { productId: string; variant?: Variant }) {
  const [state, action, pending] = useActionState(saveVariantAction.bind(null, productId, variant?.id ?? null), initial);
  return <form action={action} className="admin-form admin-card">
    <h3>{variant ? `Edit ${variant.label}` : "Add variant"}</h3>
    <label>SKU <input name="sku" required maxLength={100} defaultValue={variant?.sku} /></label>
    <label>Label <input name="label" required maxLength={150} defaultValue={variant?.label} /></label>
    <label>Attributes (JSON text pairs) <input name="attributes" defaultValue={JSON.stringify(variant?.attributes ?? {})} /></label>
    <label>Override price (BDT, optional) <input name="priceMinor" inputMode="decimal" defaultValue={amount(variant?.priceMinor)} /></label>
    <label className="admin-check"><input name="trackInventory" type="checkbox" defaultChecked={variant?.trackInventory ?? true} /> Track inventory</label>
    <label>Stock (required if tracking; ignored otherwise) <input name="stockQuantity" type="number" min="0" step="1" defaultValue={variant?.stockQuantity ?? 0} /></label>
    <label className="admin-check"><input name="isActive" type="checkbox" defaultChecked={variant?.isActive ?? true} /> Active</label>
    <button type="submit" className="button button-dark" disabled={pending}>Save variant</button>
    <p role="status" aria-live="polite">{state.message}</p>
    {state.errors && <ul className="checkout-error">{Object.entries(state.errors).map(([field, errors]) => <li key={field}>{field}: {errors.join(", ")}</li>)}</ul>}
  </form>;
}

export function ArchiveProduct({ id }: { id: string }) {
  const [state, action, pending] = useActionState(archiveProductAction.bind(null, id), initial);
  return <form action={action} className="admin-card"><button className="button button-dark" disabled={pending}>Unpublish / archive</button>
    <p role="status" aria-live="polite">{state.message}</p></form>;
}
