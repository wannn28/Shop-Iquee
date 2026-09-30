"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonClass } from "@/components/ui/Button";
import { formatPrice } from "@/lib/money";
import type { Order } from "@/lib/types";
import { useCart } from "@/store/cart";

export function Confirmation() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const redirectStatus = params.get("redirect_status");
  const clear = useCart((state) => state.clear);
  const [order, setOrder] = useState<Order | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (redirectStatus === "succeeded" || redirectStatus === "processing") {
      clear();
    }
  }, [clear, redirectStatus]);

  useEffect(() => {
    if (!orderId) {
      setReady(true);
      return;
    }

    let cancelled = false;
    let timer = 0;

    async function load() {
      const response = await fetch(`/api/orders/${orderId}`);
      if (cancelled) return;
      if (!response.ok) {
        setOrder(null);
        setReady(true);
        return;
      }
      const data = (await response.json()) as { order?: Order };
      if (cancelled || !data.order) return;
      setOrder(data.order);
      setReady(true);
      if (data.order.status === "pending") {
        timer = window.setTimeout(() => {
          void load();
        }, 2000);
      }
    }

    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [orderId]);

  if (!ready) {
    return <div className="h-40 animate-pulse rounded-card bg-bg-muted" />;
  }

  if (!order) {
    return (
      <div className="max-w-xl">
        <h1 className="type-h1">Order not on this server</h1>
        <p className="mt-3 text-fg-muted">
          {orderId
            ? `${orderId} is not stored. Orders stay in this server process until a database is connected.`
            : "Place an order to see a status page."}
        </p>
        <Link href="/products" className={buttonClass({ size: "lg", className: "mt-6" })}>
          Back to the catalog
        </Link>
      </div>
    );
  }

  const copy = statusCopy(order);

  return (
    <div className="max-w-xl">
      <p className={`type-small ${copy.tone}`}>{copy.eyebrow}</p>
      <h1 className="type-h1 mt-2">{order.id}</h1>
      <p className="mt-3 text-fg-muted">{copy.body}</p>
      <ul className="mt-8 divide-y divide-border border-y border-border">
        {order.items.map((item) => (
          <li key={`${item.name}-${item.unitPrice}-${item.quantity}`} className="flex items-start justify-between gap-4 py-3">
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

function statusCopy(order: Order) {
  if (order.demo || order.status === "demo") {
    return {
      eyebrow: "Demo checkout",
      tone: "text-fg-muted",
      body: `No charge was made for ${order.email}. This is not a confirmed order.`,
    };
  }
  if (order.status === "confirmed") {
    return {
      eyebrow: "Order confirmed",
      tone: "text-success",
      body: `Stripe confirmed the payment for ${order.email}.`,
    };
  }
  if (order.status === "failed") {
    return {
      eyebrow: "Payment failed",
      tone: "text-error",
      body: `Stripe did not capture a payment for ${order.email}.`,
    };
  }
  return {
    eyebrow: "Payment submitted",
    tone: "text-warning",
    body: `Stripe has not confirmed this charge for ${order.email} yet. The order is not confirmed.`,
  };
}
