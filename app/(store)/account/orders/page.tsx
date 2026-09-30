import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { sampleOrders } from "@/lib/fixtures/orders";
import { formatPrice } from "@/lib/money";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <Container className="py-12 md:py-16">
      <div className="max-w-[640px]">
        <h1 className="type-h1">Orders</h1>
        <p className="mt-3 type-small text-fg-muted">
          Sample history until accounts are connected to WooCommerce.{" "}
          <Link href="/account/login" className="underline">
            Sign in
          </Link>
        </p>
        {sampleOrders.length === 0 ? (
          <p className="mt-8">No orders yet.</p>
        ) : (
          <ul className="mt-8 divide-y divide-border border-y border-border">
            {sampleOrders.map((order) => (
              <li key={order.id} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="type-card">{order.id}</p>
                  <p className="type-small text-fg-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {" · "}
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="type-price">{formatPrice(order.total, order.currency)}</p>
                  <p className={`type-small ${order.status === "cancelled" ? "text-error" : "text-fg-muted"}`}>
                    {order.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}
