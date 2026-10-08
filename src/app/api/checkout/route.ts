import { ZodError } from "zod";
import { CheckoutError, placeCodOrder } from "@/features/checkout/orders";
import { previewCart } from "@/features/checkout/preview";
import { allowCheckoutAttempt, checkoutRateKey, readLimitedBody } from "@/features/checkout/abuse";
import { getLocale } from "@/i18n/server";

export const runtime = "nodejs";

export async function handle(request: Request, submit: boolean) {
  // Basic cross-origin guard. Broader abuse prevention is owned by goal 08.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.slice(0, -1);
  // Next may normalize request.url to localhost in standalone mode; compare the
  // browser's Origin to the actual Host (and trusted proxy protocol) instead.
  if (!origin || !host || origin !== `${protocol}://${host}`) return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return Response.json({ error: "JSON required" }, { status: 415 });
  if (submit && !allowCheckoutAttempt(checkoutRateKey(request))) return Response.json({ error: "Too many checkout attempts. Please try later." }, { status: 429, headers: { "Retry-After": "600", "Cache-Control": "no-store" } });
  try {
    const body = await readLimitedBody(request, 8192);
    if (body === null) return Response.json({ error: "Request too large or unsupported encoding" }, { status: 413 });
    const data: unknown = JSON.parse(body);
    if (submit) return Response.json(await placeCodOrder(data), { status: 201, headers: { "Cache-Control": "no-store" } });
    const input = data as { items?: unknown; shippingZone?: unknown };
    if (input?.shippingZone !== "inside-dhaka" && input?.shippingZone !== "outside-dhaka") return Response.json({ error: "Invalid shipping zone" }, { status: 400 });
    return Response.json(await previewCart(input.items, input.shippingZone, undefined, await getLocale()), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) return Response.json({ error: "Invalid checkout details. Review your cart and address." }, { status: 400 });
    if (error instanceof CheckoutError) return Response.json({ error: error.message, code: error.code }, { status: error.code === "SHIPPING_NOT_CONFIGURED" ? 503 : 409 });
    // Do not serialize database or customer data into an error response.
    return Response.json({ error: "Checkout is temporarily unavailable. Please retry." }, { status: 503 });
  }
}

export async function POST(request: Request) { return handle(request, true); }
