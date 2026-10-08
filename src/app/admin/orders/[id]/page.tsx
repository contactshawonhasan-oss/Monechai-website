import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/features/admin/auth";
import { getOrderDetail, nextStatuses } from "@/features/admin/orders";
import { CodPaymentForm, OrderStatusForm } from "@/features/admin/order-status-form";
import { formatBdt } from "@/lib/money";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const detail = await getOrderDetail(getDb(), id);
  if (!detail) notFound();
  const { order: o, items, history, paymentHistory } = detail;
  return <main id="main-content" className="admin-catalog">
    <nav aria-label="Admin"><Link href="/admin/orders">Orders</Link> / {o.orderNumber}</nav>
    <h1>Order {o.orderNumber}</h1>
    <p>Placed <time dateTime={o.createdAt.toISOString()}>{o.createdAt.toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</time> · Updated <time dateTime={o.updatedAt.toISOString()}>{o.updatedAt.toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</time></p>
    <p>Status: <strong>{o.status.replaceAll("_", " ")}</strong> · Payment: {o.paymentMethod.toUpperCase()} / {o.paymentStatus}</p>
    <OrderStatusForm id={id} next={nextStatuses(o.status)} />
    {o.status === "delivered" && o.paymentMethod === "cod" && o.paymentStatus === "pending" && <CodPaymentForm id={id} />}
    <h2>Customer and delivery</h2>
    <p>{o.customerName} · <a href={`tel:${o.phone}`}>{o.phone}</a></p>
    <p>{o.address} · {o.area} · {o.shippingZoneName}</p>
    {o.note && <p>Customer note: {o.note}</p>}
    <h2>Purchased items (immutable snapshots)</h2>
    <ul className="admin-product-list">{items.map((item) => <li className="admin-card" key={item.id}>
      <strong>{item.productName}</strong> ({item.productSku}) · {item.variantLabel} ({item.variantSku})
      {Object.keys(item.attributes).length > 0 && <div>{Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}</div>}
      <div>{item.quantity} × {formatBdt(item.unitPriceMinor)} = {formatBdt(item.lineTotalMinor)}</div>
    </li>)}</ul>
    <h2>Totals</h2><p>Subtotal: {formatBdt(o.subtotalMinor)} · Shipping: {formatBdt(o.shippingMinor)} · Discount: {formatBdt(o.discountMinor)}</p>
    <p><strong>Total: {formatBdt(o.totalMinor)}</strong></p>
    <h2>Status history</h2>
    <ol>{history.map((h) => <li key={h.id}><time dateTime={h.createdAt.toISOString()}>{h.createdAt.toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</time>: {h.fromStatus ? `${h.fromStatus.replaceAll("_", " ")} → ` : ""}{h.toStatus.replaceAll("_", " ")}{h.actorUserId ? ` (admin ${h.actorUserId})` : " (checkout or migration)"}</li>)}</ol>
    <h2>Payment history</h2><ol>{paymentHistory.map((h) => <li key={h.id}><time dateTime={h.createdAt.toISOString()}>{h.createdAt.toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</time>: {h.fromStatus} → {h.toStatus} (admin {h.actorUserId})</li>)}</ol>
  </main>;
}
