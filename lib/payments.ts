import type Stripe from "stripe";

import { ordersStoreFor } from "@/lib/order-store";
import { wooConfigured } from "@/lib/woo/rest";

/**
 * Apply a verified Stripe event to the stored order.
 * Callers must verify the webhook signature before this runs.
 * `confirmed` is set only for a succeeded PaymentIntent whose amount matches.
 */
export async function applyStripePaymentEvent(event: Stripe.Event) {
  if (event.type !== "payment_intent.succeeded" && event.type !== "payment_intent.payment_failed") {
    return { updated: false, reason: "ignored" };
  }

  const intent = event.data.object;
  const orderId = intent.metadata?.orderId;
  if (!orderId) return { updated: false, reason: "missing-order" };

  const store = ordersStoreFor(wooConfigured() ? "stripe" : "demo");
  const order = await store.get(orderId);
  if (!order) return { updated: false, reason: "unknown-order" };
  if (order.demo || order.status === "demo") return { updated: false, reason: "demo" };

  if (event.type === "payment_intent.payment_failed") {
    const failed = await store.markFailed(orderId);
    return failed ? { updated: true, reason: "failed" } : { updated: false, reason: "unchanged" };
  }

  const expected = Math.round(order.total * 100);
  if (intent.amount !== expected) return { updated: false, reason: "amount" };
  if (intent.currency.toLowerCase() !== order.currency.toLowerCase()) {
    return { updated: false, reason: "currency" };
  }
  if (!intent.id) return { updated: false, reason: "intent" };

  const paid = await store.markPaid(orderId, intent.id);
  return paid ? { updated: true, reason: "paid" } : { updated: false, reason: "unchanged" };
}
