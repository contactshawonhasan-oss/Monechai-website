"use client";

import { useActionState } from "react";
import { changeOrderStatusAction, recordCodPaymentAction } from "./order-actions";
import type { OrderStatus } from "./orders";

export function CodPaymentForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(recordCodPaymentAction.bind(null, id), { message: "" });
  return <form action={action} className="admin-card">
    <label><input type="checkbox" name="cashReceived" value="yes" required /> I confirm cash was actually received for this delivered COD order.</label>{" "}
    <button className="button button-dark" disabled={pending}>{pending ? "Recording…" : "Record COD paid"}</button>
    <p aria-live="polite">{state.message}</p>
  </form>;
}

export function OrderStatusForm({ id, next }: { id: string; next: readonly OrderStatus[] }) {
  const [state, action, pending] = useActionState(changeOrderStatusAction.bind(null, id), { message: "" });
  if (!next.length) return <p>No further status changes are available.</p>;
  return <form action={action}>
    <label htmlFor="next-order-status">Change order status</label>{" "}
    <select id="next-order-status" name="status" required>{next.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select>{" "}
    <button className="button button-dark" type="submit" disabled={pending}>{pending ? "Saving…" : "Save status"}</button>
    <p aria-live="polite">{state.message}</p>
  </form>;
}
