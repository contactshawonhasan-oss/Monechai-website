// Public product image keys only; legacy demoSourceUrl is never used here.
// Until Storage is configured by the owner, show an honest branded placeholder.
export function productImageUrl(key: string | null | undefined): string | null {
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !origin || !/^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.(jpg|jpeg|png|webp|avif)$/.test(key) || key.includes("..")) return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash) return null;
    return `${url.origin}/storage/v1/object/public/products/${key.split("/").map(encodeURIComponent).join("/")}`;
  } catch {
    return null;
  }
}
