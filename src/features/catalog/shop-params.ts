export type ShopParams = { q?: string | string[]; category?: string | string[]; sort?: string | string[]; page?: string | string[] };
export type ShopState = { q: string; category: string; sort: "newest" | "price-asc" | "price-desc"; page: number };
const first = (value: string | string[] | undefined) => typeof value === "string" ? value : "";

export function parseShopParams(raw: ShopParams): ShopState {
  const q = first(raw.q).trim().slice(0, 100);
  const category = first(raw.category);
  const sort = first(raw.sort);
  const page = first(raw.page);
  return {
    q, category: /^[a-z0-9]+(-[a-z0-9]+)*$/.test(category) && category.length <= 100 ? category : "",
    sort: sort === "price-asc" || sort === "price-desc" ? sort : "newest",
    page: /^[1-9]\d{0,3}$/.test(page) ? Number(page) : 1,
  };
}

export function shopHref(state: ShopState, page: number): string {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.category) params.set("category", state.category);
  if (state.sort !== "newest") params.set("sort", state.sort);
  if (page > 1) params.set("page", String(page));
  return `/shop${params.size ? `?${params}` : ""}`;
}
