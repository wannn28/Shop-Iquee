import Stripe from "stripe";

import { priceCheckout, validateCheckout } from "@/lib/checkout";
import { apiJson, apiOptions } from "@/lib/http";
import { getProducts } from "@/lib/products.server";
import type { Order } from "@/lib/types";

export function OPTIONS() {
  return apiOptions();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validated = validateCheckout(body);
  if (!validated.ok) {
    return apiJson({ error: "Check the form and try again.", fields: validated.fields }, 400);
  }

  const priced = priceCheckout(await getProducts(), validated.value.items);
  if (!priced.ok) {
    return apiJson({ error: priced.error, fields: { form: priced.error } }, 400);
  }

  const id = `IQ-${Math.floor(10000 + Math.random() * 90000)}`;
  let status: Order["status"] = "confirmed";
  let payment: { mode: "mock" } | { mode: "stripe"; paymentIntentId: string; clientSecret: string | null } = {
    mode: "mock",
  };

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (secret) {
    try {
      const stripe = new Stripe(secret);
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(priced.total * 100),
        currency: priced.currency.toLowerCase(),
        receipt_email: validated.value.email,
        metadata: { orderId: id },
        automatic_payment_methods: { enabled: true },
      });
      status = "pending";
      payment = {
        mode: "stripe",
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
      };
    } catch (error) {
      console.error("Stripe PaymentIntent failed", error);
      return apiJson({ error: "Payment could not be started." }, 502);
    }
  }

  const order: Order = {
    id,
    email: validated.value.email,
    createdAt: new Date().toISOString(),
    status,
    items: priced.lines,
    subtotal: roundMoney(priced.subtotal),
    shipping: roundMoney(priced.shipping),
    total: roundMoney(priced.total),
    currency: priced.currency,
    shippingAddress: validated.value.shipping,
  };

  return apiJson({ order, payment });
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
