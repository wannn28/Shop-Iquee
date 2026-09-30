import "server-only";

/**
 * Server-only WooCommerce REST client (`/wp-json/wc/v3`).
 * Browser code must not import this module or call wc/v3.
 * The storefront talks to same-origin `/api/*` on NEXT_PUBLIC_SITE_URL
 * (https://store.iquee.tech). WooCommerce stays on WC_BASE_URL
 * (https://woo.iquee.tech).
 */

export function wooConfigured() {
  return Boolean(
    process.env.WC_BASE_URL?.trim() &&
      process.env.WC_CONSUMER_KEY?.trim() &&
      process.env.WC_CONSUMER_SECRET?.trim(),
  );
}

export function wooBaseUrl() {
  const value = process.env.WC_BASE_URL?.trim();
  if (!value) return "https://woo.iquee.tech";
  return value.replace(/\/$/, "");
}

export async function wooRest<T>(path: string): Promise<T> {
  const key = process.env.WC_CONSUMER_KEY?.trim();
  const secret = process.env.WC_CONSUMER_SECRET?.trim();
  if (!process.env.WC_BASE_URL?.trim() || !key || !secret) {
    throw new Error("WooCommerce REST is not configured");
  }

  const url = new URL(`/wp-json/wc/v3${path}`, wooBaseUrl());
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`WooCommerce REST ${response.status} for ${path}`);
  }

  return (await response.json()) as T;
}
