"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireAdmin } from "./auth";
import { changeOrderStatus, orderStatus, recordCodPayment } from "./orders";

export type OrderActionState = { message: string };
export async function recordCodPaymentAction(id: string, _state: OrderActionState, form: FormData): Promise<OrderActionState> {
  void _state;
  const admin = await requireAdmin();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { message: "Invalid order ID." };
  if (form.get("cashReceived") !== "yes") return { message: "Confirm that cash was received from the courier/customer." };
  const result = await recordCodPayment(getDb(), id, admin.id);
  if ("error" in result) return { message: result.error ?? "Unable to record payment." };
  revalidatePath("/admin"); revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`);
  return { message: "COD cash receipt recorded." };
}

export async function changeOrderStatusAction(id: string, _state: OrderActionState, form: FormData): Promise<OrderActionState> {
  void _state;
  const admin = await requireAdmin();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return { message: "Invalid order ID." };
  const to = orderStatus.safeParse(form.get("status"));
  if (!to.success) return { message: "Invalid order status." };
  const result = await changeOrderStatus(getDb(), id, to.data, admin.id);
  if ("error" in result) return { message: result.error ?? "Unable to update order." };
  revalidatePath("/admin"); revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`);
  return { message: `Order moved to ${result.status.replaceAll("_", " ")}.` };
}
