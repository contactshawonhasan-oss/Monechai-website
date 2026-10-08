import { z } from "zod";
import { addMinor, multiplyMinor } from "@/lib/money";

export const cartSchema = z.array(z.object({
  variantId: z.uuid(), quantity: z.number().int().min(1).max(20),
}).strict()).min(1).max(30).superRefine((items, ctx) => {
  const ids = new Set<string>();
  for (const [i, item] of items.entries()) {
    if (ids.has(item.variantId)) ctx.addIssue({ code: "custom", message: "Duplicate variant", path: [i, "variantId"] });
    ids.add(item.variantId);
  }
  if (items.reduce((sum, item) => sum + item.quantity, 0) > 100) ctx.addIssue({ code: "custom", message: "Too many items" });
});

export function normalizeBdPhone(value: string): string {
  const cleaned = value.replace(/[\s()-]/g, "");
  const local = cleaned.startsWith("+88") ? cleaned.slice(3) : cleaned.startsWith("88") ? cleaned.slice(2) : cleaned;
  if (!/^01[3-9][0-9]{8}$/.test(local)) throw new Error("Enter a valid Bangladesh mobile number");
  return `+88${local}`;
}

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
export const checkoutSchema = z.object({
  idempotencyKey: z.uuid(),
  website: z.literal("").optional(), // Honeypot. Legitimate checkout never fills this field.
  items: cartSchema,
  customerName: text(2, 120),
  phone: z.string().trim().max(40).transform((value, ctx) => {
    try { return normalizeBdPhone(value); }
    catch { ctx.addIssue({ code: "custom", message: "Enter a valid Bangladesh mobile number" }); return z.NEVER; }
  }),
  address: text(10, 500),
  area: text(2, 120),
  note: z.string().trim().max(500).optional(),
  shippingZone: z.enum(["inside-dhaka", "outside-dhaka"]),
  paymentMethod: z.literal("cod"),
}).strict();

export function calculateTotals(lines: { unitPriceMinor: number; quantity: number }[], zone: { feeMinor: number; freeAboveMinor: number | null }) {
  const subtotalMinor = addMinor(...lines.map((line) => multiplyMinor(line.unitPriceMinor, line.quantity)));
  if (!Number.isSafeInteger(zone.feeMinor) || zone.feeMinor < 0 || zone.freeAboveMinor !== null && (!Number.isSafeInteger(zone.freeAboveMinor) || zone.freeAboveMinor <= 0)) {
    throw new RangeError("Invalid shipping configuration");
  }
  const shippingMinor = zone.freeAboveMinor !== null && subtotalMinor >= zone.freeAboveMinor ? 0 : zone.feeMinor;
  const totalMinor = addMinor(subtotalMinor, shippingMinor);
  if (totalMinor > 2147483647) throw new RangeError("Order exceeds allowed amount");
  return { subtotalMinor, shippingMinor, discountMinor: 0, totalMinor };
}
