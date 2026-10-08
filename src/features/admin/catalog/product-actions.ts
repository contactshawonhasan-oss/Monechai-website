"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/features/admin/auth";
import { archiveProduct, productInput, saveProduct, saveVariant, variantInput } from "./products";

export type ProductState = { message: string; errors?: Record<string, string[]> };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const errorState = (message: string): ProductState => ({ message });
function pgCode(error: unknown) {
  let current: unknown = error;
  for (let i = 0; i < 4 && current && typeof current === "object"; i++) {
    if ("code" in current && typeof current.code === "string") return current.code;
    current = "cause" in current ? current.cause : null;
  }
}
function refresh(slugs: (string | null)[]) {
  revalidatePath("/admin/products"); revalidatePath("/"); revalidatePath("/shop");
  for (const slug of slugs) if (slug) revalidatePath(`/products/${slug}`);
}

export async function saveProductAction(id: string | null, _state: ProductState, form: FormData): Promise<ProductState> {
  void _state;
  await requireAdmin();
  if (id && !uuid.test(id)) return errorState("Invalid product ID.");
  const parsed = productInput.safeParse({
    slug: form.get("slug"), sku: form.get("sku"), categoryId: form.get("categoryId"),
    nameEn: form.get("nameEn"), nameBn: form.get("nameBn"), descriptionEn: form.get("descriptionEn"),
    descriptionBn: form.get("descriptionBn"), priceMinor: form.get("priceMinor"), compareAtMinor: form.get("compareAtMinor"),
    isFeatured: form.has("isFeatured"), isPublished: form.has("isPublished"),
  });
  if (!parsed.success) return { message: "Check the product fields.", errors: parsed.error.flatten().fieldErrors };
  let initial;
  if (!id) {
    const result = variantInput.safeParse({ sku: form.get("variantSku"), label: form.get("variantLabel"),
      attributes: {}, priceMinor: "", trackInventory: true, stockQuantity: Number(form.get("stockQuantity")), isActive: true });
    if (!result.success || !/^(0|[1-9]\d*)$/.test(String(form.get("stockQuantity") ?? "")))
      return errorState("Enter a first variant SKU, label and nonnegative whole stock quantity.");
    initial = result.data;
  }
  try {
    const result = await saveProduct(getDb(), parsed.data, id ?? undefined, initial);
    if ("error" in result) return errorState(result.error ?? "Unable to save product.");
    refresh([result.oldSlug, parsed.data.slug]);
    if (id) revalidatePath(`/admin/products/${id}`);
    if (!id) redirect(`/admin/products/${result.id}`);
    return { message: "Product saved." };
  } catch (error) {
    // redirect() throws a special exception and must not be swallowed by a generic DB handler.
    if (pgCode(error) === "23505") return errorState("Product slug or SKU is already in use.");
    throw error;
  }
}

export async function saveVariantAction(productId: string, variantId: string | null, _state: ProductState, form: FormData): Promise<ProductState> {
  void _state;
  await requireAdmin();
  if (!uuid.test(productId) || (variantId && !uuid.test(variantId))) return errorState("Invalid variant ID.");
  let attributes: unknown;
  try { attributes = JSON.parse(String(form.get("attributes") ?? "{}")); }
  catch { return errorState("Attributes must be a JSON object of text pairs, e.g. {\"size\":\"L\"}."); }
  const stock = String(form.get("stockQuantity") ?? "");
  const tracked = form.has("trackInventory");
  const result = variantInput.safeParse({ sku: form.get("sku"), label: form.get("label"), attributes,
    priceMinor: form.get("priceMinor"), trackInventory: tracked,
    stockQuantity: tracked && /^(0|[1-9]\d*)$/.test(stock) ? Number(stock) : null,
    isActive: form.has("isActive") });
  if (!result.success) return { message: "Check the variant fields (stock is required when tracked).", errors: result.error.flatten().fieldErrors };
  try {
    const row = await saveVariant(getDb(), productId, result.data, variantId ?? undefined);
    if (!row) return errorState("Product or variant no longer exists.");
    refresh([]);
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/products/[slug]", "page");
    return { message: "Variant saved." };
  } catch (error) {
    if (pgCode(error) === "23505") return errorState("Variant SKU is already in use.");
    throw error;
  }
}

export async function archiveProductAction(id: string, _state: ProductState, _form: FormData): Promise<ProductState> {
  void _state; void _form;
  await requireAdmin();
  if (!uuid.test(id)) return errorState("Invalid product ID.");
  const result = await archiveProduct(getDb(), id);
  if (!result) return errorState("Product no longer exists.");
  refresh([result.slug]); revalidatePath(`/admin/products/${id}`);
  return { message: "Product unpublished and removed from featured listings. Existing order snapshots are unchanged." };
}
