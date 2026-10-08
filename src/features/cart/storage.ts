import { cartSchema } from "@/features/checkout/domain";

export type CartItem = { variantId: string; quantity: number };
const key = "monechai:cart:v1";
export function readCart(): CartItem[] {
  try {
    const data = JSON.parse(localStorage.getItem(key) ?? "[]");
    const parsed = cartSchema.safeParse(data);
    return parsed.success ? parsed.data : [];
  } catch { return []; }
}
export function saveCart(items: CartItem[]) {
  // Browser storage only ever contains variant IDs and quantities.
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event("monechai:cart-change"));
}
export function addToCart(variantId: string) {
  const cart = readCart();
  const item = cart.find((line) => line.variantId === variantId);
  if (item && cart.reduce((sum, line) => sum + line.quantity, 0) < 100) item.quantity = Math.min(20, item.quantity + 1);
  else if (cart.length < 30 && cart.reduce((sum, line) => sum + line.quantity, 0) < 100) cart.push({ variantId, quantity: 1 });
  saveCart(cart);
}
