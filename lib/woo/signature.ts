import { createHmac, timingSafeEqual } from "node:crypto";

/** WooCommerce sends a base64 HMAC-SHA256 of the raw body in `x-wc-webhook-signature`. */
export function verifyWooWebhookSignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const actual = Buffer.from(header);
  const expected = Buffer.from(digest);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
