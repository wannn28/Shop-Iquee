"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonClass } from "@/components/ui/Button";
import { formatPrice } from "@/lib/money";
import type { Order } from "@/lib/types";

export function Confirmation() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const [order, setOrder] = useState<Order | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setReady(true);
      return;
    }
    const raw = sessionStorage.getItem(`iquee-order:${orderId}`);
    if (raw) {
      try {
        setOrder(JSON.parse(raw) as Order);
      } catch {
        setOrder(null);
      }
    }
    setReady(true);
  }, [orderId]);

  if (!ready) {
    return <div className="h-40 animate-pulse rounded-card bg-bg-muted" />;
  }

  if (!order) {
    return (
      <div className="max-w-xl">
        <h1 className="type-h1">Order not on this device</h1>
        <p className="mt-3 text-fg-muted">
          {orderId
            ? `We could not find ${orderId} in this browser. Confirmation details stay on the device that placed the order.`
            : "Place an order to see a confirmation."}
        </p>
        <Link href="/products" className={buttonClass({ size: "lg", className: "mt-6" })}>
          Back to the catalog
        </Link>
      </div>
    );
  }

  const pending = order.status === "pending";

  return (
    <div className="max-w-xl">
      <p className={`type-small ${pending ? "text-warning" : "text-success"}`}>
        {pending ? "Payment pending" : "Order confirmed"}
      </p>
      <h1 className="type-h1 mt-2">{order.id}</h1>
      <p className="mt-3 text-fg-muted">
        {pending
          ? `A Stripe payment was started for ${order.email}. The order is not paid yet.`
          : `A receipt outline was saved for ${order.email}. No charge was made in demo mode.`}
      </p>
      <ul className="mt-8 divide-y divide-border border-y border-border">
        {order.items.map((item) => (
          <li key={`${item.name}-${item.unitPrice}`} className="flex items-start justify-between gap-4 py-3">
            <div>
              <p className="type-card">
                {item.name} × {item.quantity}
              </p>
              {Object.keys(item.attributes).length > 0 ? (
                <p className="type-small text-fg-muted">{Object.values(item.attributes).join(" / ")}</p>
              ) : null}
            </div>
            <p className="type-price">{formatPrice(item.unitPrice * item.quantity, order.currency)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2">
        <div className="flex justify-between type-small">
          <dt className="text-fg-muted">Shipping</dt>
          <dd>{order.shipping === 0 ? "Free" : formatPrice(order.shipping, order.currency)}</dd>
        </div>
        <div className="flex justify-between type-price">
          <dt>Total</dt>
          <dd>{formatPrice(order.total, order.currency)}</dd>
        </div>
      </dl>
      <p className="mt-6 type-small text-fg-muted">
        Ships to {order.shippingAddress.line1}, {order.shippingAddress.city} {order.shippingAddress.postalCode}
      </p>
      <Link href="/products" className={buttonClass({ size: "lg", className: "mt-8" })}>
        Continue shopping
      </Link>
    </div>
  );
}
