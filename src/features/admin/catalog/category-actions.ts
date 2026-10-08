"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/admin/auth";
import { getDb } from "@/db/client";
import { categoryInput, deleteEmptyCategory, saveCategory } from "./categories";

export type CategoryState = { message: string; errors?: Record<string, string[]> };
const initialError = (message: string): CategoryState => ({ message });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pgCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let i = 0; i < 4 && current && typeof current === "object"; i++) {
    if ("code" in current && typeof current.code === "string") return current.code;
    current = "cause" in current ? current.cause : null;
  }
}

function refreshCatalog() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/products/[slug]", "page");
}

export async function saveCategoryAction(id: string | null, _state: CategoryState, form: FormData): Promise<CategoryState> {
  await requireAdmin();
  if (id && !uuid.test(id)) return initialError("Invalid category ID.");
  const parsed = categoryInput.safeParse({
    slug: form.get("slug"), nameEn: form.get("nameEn"), nameBn: form.get("nameBn"), sortOrder: form.get("sortOrder"),
  });
  if (!parsed.success) return { message: "Check the highlighted fields.", errors: parsed.error.flatten().fieldErrors };
  try {
    const row = await saveCategory(getDb(), parsed.data, id ?? undefined);
    if (!row) return initialError("Category no longer exists. Refresh this page.");
  } catch (error) {
    if (pgCode(error) === "23505") return initialError("That category slug is already in use.");
    throw error;
  }
  refreshCatalog();
  return { message: "Category saved." };
}

export async function deleteCategoryAction(id: string, _state: CategoryState, _form: FormData): Promise<CategoryState> {
  void _state; void _form;
  await requireAdmin();
  if (!uuid.test(id)) return initialError("Invalid category ID.");
  try {
    if (!(await deleteEmptyCategory(getDb(), id))) return initialError("Only empty categories can be deleted. Refresh this page.");
  } catch (error) {
    if (pgCode(error) === "23503") return initialError("This category now has products and cannot be deleted.");
    throw error;
  }
  refreshCatalog();
  return { message: "Category deleted." };
}
