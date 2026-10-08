import Link from "next/link";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/features/admin/auth";
import { listOrders, orderStatus } from "@/features/admin/orders";
import { formatBdt } from "@/lib/money";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string; number?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const page = params.page && /^[1-9]\d{0,4}$/.test(params.page) ? Number(params.page) : 1;
  const status = orderStatus.safeParse(params.status).data;
  const number = params.number?.trim().toUpperCase();
  const search = number && /^MC-[A-F0-9]{16}$/.test(number) ? number : undefined;
  const { items, total } = await listOrders(getDb(), page, status, search);
  const href = (p: number) => `/admin/orders?${new URLSearchParams({ ...(status ? { status } : {}), ...(search ? { number: search } : {}), page: String(p) })}`;
  return <main id="main-content" className="admin-catalog">
    <nav aria-label="Admin"><Link href="/admin">Dashboard</Link> / Orders</nav>
    <h1>Orders</h1>
    <form method="get"><label htmlFor="order-number">Order number</label>{" "}<input id="order-number" name="number" defaultValue={search ?? ""} placeholder="MC-…" />{" "}
      <label htmlFor="order-status-filter">Status</label>{" "}<select id="order-status-filter" name="status" defaultValue={status ?? ""}>
        <option value="">All</option>{orderStatus.options.map((s) => <option value={s} key={s}>{s.replaceAll("_", " ")}</option>)}
      </select>{" "}<button type="submit" className="button button-dark">Filter</button></form>
    <p>{total} orders. Customer information is for fulfillment only.</p>
    <ul className="admin-product-list">{items.map((o) => <li className="admin-card" key={o.id}>
      <Link href={`/admin/orders/${o.id}`}><strong>{o.orderNumber}</strong></Link> · <time dateTime={o.createdAt.toISOString()}>{o.createdAt.toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</time>
      <div>{o.customerName} · {o.phone} · {o.area}</div>
      <div>{formatBdt(o.totalMinor)} · {o.paymentMethod.toUpperCase()} / {o.paymentStatus} · {o.status.replaceAll("_", " ")}</div>
    </li>)}</ul>
    {!items.length && <p>No orders on this page.</p>}
    <nav aria-label="Order pages" className="pagination">{page > 1 && <Link href={href(page - 1)}>Previous</Link>} <span>Page {page}</span> {page * 30 < total && <Link href={href(page + 1)}>Next</Link>}</nav>
  </main>;
}
