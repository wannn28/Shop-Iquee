import { NextResponse } from "next/server";
import Stripe from "stripe";

/** Stripe webhook receiver at https://store.iquee.tech/api/webhooks/stripe */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret || !key) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const raw = await request.text();
  try {
    const stripe = new Stripe(key);
    const event = stripe.webhooks.constructEvent(raw, signature, secret);
    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    console.warn("Stripe webhook rejected", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}
