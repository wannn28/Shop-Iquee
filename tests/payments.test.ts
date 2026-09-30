import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Stripe from "stripe";

import { POST as checkout } from "@/app/api/checkout/route";
import { POST as stripeWebhook } from "@/app/api/webhooks/stripe/route";
import { getOrder, resetOrderStore, saveOrder } from "@/lib/orders";
import { applyStripePaymentEvent } from "@/lib/payments";
import { resetRateLimits } from "@/lib/rate-limit";
import type { Order } from "@/lib/types";

const secretKey = ["sk", "test", "examplekeyexamplekeyex"].join("_");
const webhookSecret = "whsec_test_secret";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

const savedEnv = {
  CHECKOUT_DEMO: process.env.CHECKOUT_DEMO,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
};

function checkoutBody(quantity = 1) {
  return {
    email: "guest@example.com",
    paymentMethod: "card",
    shipping: {
      firstName: "Avery",
      lastName: "Cole",
      line1: "18 Mercer Street",
      city: "New York",
      region: "NY",
      postalCode: "10013",
      country: "US",
    },
    items: [{ productId: 1001, quantity }],
  };
}

function checkoutRequest(body: unknown, key: string, origin = "https://store.iquee.tech") {
  return new Request("https://store.iquee.tech/api/checkout", {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/json",
      "idempotency-key": key,
      "x-real-ip": "203.0.113.10",
    },
    body: JSON.stringify(body),
  });
}

function pendingOrder(total = 80): Order {
  return {
    id: "IQ-AABBCCDDEEFF",
    email: "guest@example.com",
    createdAt: "2026-09-30T00:00:00.000Z",
    status: "pending",
    demo: false,
    currency: "USD",
    subtotal: total,
    shipping: 0,
    total,
    items: [{ name: "Merino Crew", quantity: 1, unitPrice: total, attributes: {} }],
    shippingAddress: checkoutBody().shipping,
  };
}

describe("checkout guards", () => {
  beforeEach(() => {
    resetOrderStore();
    resetRateLimits();
    process.env.CHECKOUT_DEMO = "true";
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    restoreEnv("CHECKOUT_DEMO", savedEnv.CHECKOUT_DEMO);
    restoreEnv("STRIPE_SECRET_KEY", savedEnv.STRIPE_SECRET_KEY);
    restoreEnv("STRIPE_WEBHOOK_SECRET", savedEnv.STRIPE_WEBHOOK_SECRET);
    restoreEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", savedEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  });

  it("stores a demo order and replays the same idempotency key", async () => {
    const first = await checkout(checkoutRequest(checkoutBody(), "demo-key-0000000001"));
    const firstBody = (await first.json()) as { order: Order; demo: boolean; clientSecret: string | null };
    expect(first.status).toBe(200);
    expect(firstBody.demo).toBe(true);
    expect(firstBody.clientSecret).toBeNull();
    expect(firstBody.order.status).toBe("demo");
    expect(firstBody.order.status).not.toBe("confirmed");
    expect(firstBody.order.id).toMatch(/^IQ-[A-F0-9]{12}$/);

    const second = await checkout(checkoutRequest(checkoutBody(), "demo-key-0000000001"));
    const secondBody = (await second.json()) as { order: Order };
    expect(second.status).toBe(200);
    expect(secondBody.order.id).toBe(firstBody.order.id);

    const changed = await checkout(checkoutRequest(checkoutBody(2), "demo-key-0000000001"));
    expect(changed.status).toBe(409);
  });

  it("rejects a cross-site origin and a missing idempotency key", async () => {
    const crossSite = await checkout(
      checkoutRequest(checkoutBody(), "demo-key-0000000002", "https://evil.example"),
    );
    expect(crossSite.status).toBe(403);

    const missingKey = await checkout(
      new Request("https://store.iquee.tech/api/checkout", {
        method: "POST",
        headers: { origin: "https://store.iquee.tech", "content-type": "application/json", "x-real-ip": "203.0.113.11" },
        body: JSON.stringify(checkoutBody()),
      }),
    );
    expect(missingKey.status).toBe(400);
  });

  it("rate limits repeated checkout attempts", async () => {
    let status = 0;
    for (let attempt = 0; attempt < 11; attempt += 1) {
      const response = await checkout(
        checkoutRequest(checkoutBody(), `rate-key-${String(attempt).padStart(12, "0")}`),
      );
      status = response.status;
    }
    expect(status).toBe(429);
  });

  it("refuses to mint a PaymentIntent when Stripe is only partly configured", async () => {
    delete process.env.CHECKOUT_DEMO;
    process.env.STRIPE_SECRET_KEY = secretKey;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const response = await checkout(checkoutRequest(checkoutBody(), "partial-key-00000001"));
    expect(response.status).toBe(503);
    expect(getOrder).toBeTypeOf("function");
  });
});

describe("stripe webhook", () => {
  beforeEach(() => {
    resetOrderStore();
    process.env.STRIPE_SECRET_KEY = secretKey;
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
  });

  afterEach(() => {
    restoreEnv("STRIPE_SECRET_KEY", savedEnv.STRIPE_SECRET_KEY);
    restoreEnv("STRIPE_WEBHOOK_SECRET", savedEnv.STRIPE_WEBHOOK_SECRET);
  });

  it("marks the stored order paid only after a verified succeeded event", async () => {
    const order = saveOrder({ ...pendingOrder(), paymentIntentId: "pi_test_1" });
    const stripe = new Stripe(secretKey);
    const payload = JSON.stringify({
      id: "evt_test_paid",
      object: "event",
      api_version: "2024-06-20",
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_1",
          object: "payment_intent",
          amount: 8000,
          currency: "usd",
          status: "succeeded",
          metadata: { orderId: order.id },
        },
      },
    });
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });

    const rejected = await stripeWebhook(
      new Request("https://store.iquee.tech/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": `${signature}x` },
        body: payload,
      }),
    );
    expect(rejected.status).toBe(400);
    expect(getOrder(order.id)?.status).toBe("pending");

    const accepted = await stripeWebhook(
      new Request("https://store.iquee.tech/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      }),
    );
    expect(accepted.status).toBe(200);
    expect(getOrder(order.id)?.status).toBe("confirmed");
  });

  it("does not confirm a mismatched amount, a demo order, or a failed payment", () => {
    const order = saveOrder(pendingOrder());
    const mismatch = applyStripePaymentEvent({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_wrong_amount",
          object: "payment_intent",
          amount: 100,
          currency: "usd",
          metadata: { orderId: order.id },
        },
      },
    } as unknown as Stripe.Event);
    expect(mismatch.reason).toBe("amount");
    expect(getOrder(order.id)?.status).toBe("pending");

    const demo = saveOrder({ ...pendingOrder(), id: "IQ-112233445566", status: "demo", demo: true });
    const ignored = applyStripePaymentEvent({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_demo",
          object: "payment_intent",
          amount: 8000,
          currency: "usd",
          metadata: { orderId: demo.id },
        },
      },
    } as unknown as Stripe.Event);
    expect(ignored.reason).toBe("demo");
    expect(getOrder(demo.id)?.status).toBe("demo");

    applyStripePaymentEvent({
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_failed",
          object: "payment_intent",
          amount: 8000,
          currency: "usd",
          metadata: { orderId: order.id },
        },
      },
    } as unknown as Stripe.Event);
    expect(getOrder(order.id)?.status).toBe("failed");
  });
});
