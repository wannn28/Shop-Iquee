import Stripe from "stripe";
import { NextResponse } from "next/server";

import { isAllowedCheckoutOrigin } from "@/lib/checkout-origin";
import { checkoutFingerprint, checkoutMode, priceCheckout, validateCheckout } from "@/lib/checkout";
import { apiHeaders, apiJson, apiOptions } from "@/lib/http";
import {
  claimCheckout,
  getOrder,
  markOrderFailed,
  markOrderPending,
  newOrderId,
  recallAttempt,
  releaseCheckout,
  rememberAttempt,
  saveOrder,
  type StoredOrder,
} from "@/lib/orders";
import { getProducts } from "@/lib/products.server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{16,80}$/;
const CHECKOUT_LIMIT = 10;
const CHECKOUT_WINDOW_MS = 10 * 60 * 1000;

export function OPTIONS() {
  return apiOptions();
}

export async function POST(request: Request) {
  if (!isAllowedCheckoutOrigin(request)) {
    return apiJson({ error: "Checkout is only available from this storefront." }, 403);
  }

  const limited = rateLimit(`checkout:${clientIp(request)}`, CHECKOUT_LIMIT, CHECKOUT_WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Try again shortly." },
      { status: 429, headers: { ...apiHeaders(), "Retry-After": String(limited.retryAfter) } },
    );
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
    return apiJson({ error: "Include an idempotency key and try again." }, 400);
  }

  const body = await request.json().catch(() => null);
  const validated = validateCheckout(body);
  if (!validated.ok) {
    return apiJson({ error: "Check the form and try again.", fields: validated.fields }, 400);
  }

  const priced = priceCheckout(await getProducts(), validated.value.items);
  if (!priced.ok) {
    return apiJson({ error: priced.error, fields: { form: priced.error } }, 400);
  }

  const fingerprint = checkoutFingerprint(validated.value, priced.total);
  const mode = checkoutMode();
  if (mode === "misconfigured") {
    return apiJson(
      { error: "Stripe is only partly configured. Set both keys, or CHECKOUT_DEMO=true for a no-charge preview." },
      503,
    );
  }

  if (!claimCheckout(idempotencyKey)) {
    return apiJson({ error: "This checkout is already in progress." }, 409);
  }

  try {
    const existing = recallAttempt(idempotencyKey);
    if (existing && existing.fingerprint !== fingerprint) {
      return apiJson({ error: "The cart changed. Start checkout again." }, 409);
    }

    let order: StoredOrder;
    if (existing) {
      const stored = getOrder(existing.orderId);
      if (!stored) return apiJson({ error: "This checkout expired. Start again." }, 409);
      order = stored;
      if (order.status === "confirmed") {
        return apiJson({ order, demo: false, clientSecret: null, paid: true });
      }
      if (existing.clientSecret) {
        return apiJson({ order, demo: existing.demo, clientSecret: existing.clientSecret, paid: false });
      }
    } else {
      order = saveOrder({
        id: newOrderId(),
        email: validated.value.email,
        createdAt: new Date().toISOString(),
        status: mode === "demo" ? "demo" : "pending",
        demo: mode === "demo",
        items: priced.lines,
        subtotal: roundMoney(priced.subtotal),
        shipping: roundMoney(priced.shipping),
        total: roundMoney(priced.total),
        currency: priced.currency,
        shippingAddress: validated.value.shipping,
      });
      rememberAttempt(idempotencyKey, {
        fingerprint,
        orderId: order.id,
        clientSecret: null,
        demo: mode === "demo",
      });
    }

    if (mode === "demo" || order.demo) {
      return apiJson({ order, demo: true, clientSecret: null, paid: false });
    }

    const secret = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secret) {
      return apiJson({ error: "Stripe is not configured." }, 503);
    }

    try {
      const stripe = new Stripe(secret);
      const amount = Math.round(order.total * 100);
      const intent = await stripe.paymentIntents.create(
        {
          amount,
          currency: order.currency.toLowerCase(),
          receipt_email: order.email,
          metadata: { orderId: order.id },
          payment_method_types: ["card"],
          description: `iquee ${order.id}`,
        },
        { idempotencyKey },
      );
      if (!intent.client_secret) {
        markOrderFailed(order.id);
        return apiJson({ error: "Payment could not be started." }, 502);
      }
      const pending = markOrderPending(order.id, intent.id) ?? order;
      rememberAttempt(idempotencyKey, {
        fingerprint,
        orderId: pending.id,
        clientSecret: intent.client_secret,
        demo: false,
      });
      return apiJson({ order: pending, demo: false, clientSecret: intent.client_secret, paid: false });
    } catch (error) {
      console.error("Stripe PaymentIntent failed", error);
      markOrderFailed(order.id);
      return apiJson({ error: "Payment could not be started." }, 502);
    }
  } finally {
    releaseCheckout(idempotencyKey);
  }
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
