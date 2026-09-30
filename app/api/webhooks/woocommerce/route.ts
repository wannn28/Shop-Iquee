import { NextResponse } from "next/server";

import { verifyWooWebhookSignature } from "@/lib/woo/signature";

/**
 * WooCommerce webhook receiver.
 * Point delivery at https://store.iquee.tech/api/webhooks/woocommerce
 * and sign with WC_WEBHOOK_SECRET. The storefront never calls wc/v3 from the browser.
 */
export async function POST(request: Request) {
  const secret = process.env.WC_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "WC_WEBHOOK_SECRET is not configured" }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-wc-webhook-signature");
  if (!verifyWooWebhookSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  return NextResponse.json({
    received: true,
    topic: request.headers.get("x-wc-webhook-topic"),
    resource: request.headers.get("x-wc-webhook-resource"),
  });
}
