"use client";

import { useActionState } from "react";
import { saveCategoryAction, deleteCategoryAction, type CategoryState } from "./category-actions";

const initial: CategoryState = { message: "" };

type Row = { id: string; slug: string; nameEn: string; nameBn: string | null; sortOrder: number; productCount: number };

export function CategoryForm({ category }: { category?: Row }) {
  const [state, action, pending] = useActionState(saveCategoryAction.bind(null, category?.id ?? null), initial);
  return <form action={action} className="admin-form admin-card">
    <h2>{category ? `Edit ${category.nameEn}` : "New category"}</h2>
    <label>Slug <input name="slug" required maxLength={150} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={category?.slug} aria-invalid={Boolean(state.errors?.slug)} /></label>
    {state.errors?.slug && <p className="checkout-error">{state.errors.slug.join(", ")}</p>}
    <label>English name <input name="nameEn" required maxLength={150} defaultValue={category?.nameEn} aria-invalid={Boolean(state.errors?.nameEn)} /></label>
    {state.errors?.nameEn && <p className="checkout-error">{state.errors.nameEn.join(", ")}</p>}
    <label>Bangla name (optional) <input name="nameBn" maxLength={150} defaultValue={category?.nameBn ?? ""} aria-invalid={Boolean(state.errors?.nameBn)} /></label>
    {state.errors?.nameBn && <p className="checkout-error">{state.errors.nameBn.join(", ")}</p>}
    <label>Sort order <input name="sortOrder" type="number" min="0" max="100000" step="1" required defaultValue={category?.sortOrder ?? 0} aria-invalid={Boolean(state.errors?.sortOrder)} /></label>
    {state.errors?.sortOrder && <p className="checkout-error">{state.errors.sortOrder.join(", ")}</p>}
    <button type="submit" className="button button-dark" disabled={pending}>{pending ? "Saving…" : "Save category"}</button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}

export function DeleteCategory({ category }: { category: Row }) {
  const [state, action, pending] = useActionState(deleteCategoryAction.bind(null, category.id), initial);
  if (category.productCount) return <span>Contains {category.productCount} product(s); cannot delete.</span>;
  return <form action={action}>
    <button className="button button-dark" type="submit" disabled={pending}>Delete empty category</button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}
