import "server-only";

import { wooBaseUrl } from "@/lib/woo/rest";

/**
 * Server-side client for the WooCommerce Store API (`/wp-json/wc/store/v1`).
 * Cart UI state lives in Zustand. Route handlers under `/api/*` are the only
 * browser-facing sync point — do not call this from client components.
 */

export type StoreCartItem = {
  key: string;
  id: number;
  quantity: number;
  name: string;
  prices: {
    price: string;
    currency_code: string;
    currency_minor_unit: number;
  };
};

export type StoreCart = {
  items: StoreCartItem[];
  totals: {
    total_items: string;
    total_shipping: string;
    total_price: string;
    currency_code: string;
    currency_minor_unit: number;
  };
};

export function storeApiConfigured() {
  return Boolean(process.env.WC_BASE_URL?.trim());
}

export async function storeApi<T>(path: string, init?: RequestInit): Promise<T> {
  if (!storeApiConfigured()) {
    throw new Error("WC_BASE_URL is not set");
  }

  const url = new URL(`/wp-json/wc/store/v1${path}`, wooBaseUrl());
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Store API ${response.status} for ${path}`);
  }

  return (await response.json()) as T;
}

export function getStoreCart(cartToken?: string) {
  return storeApi<StoreCart>("/cart", {
    headers: cartToken ? { "Cart-Token": cartToken } : undefined,
  });
}

export function addStoreCartItem(input: { id: number; quantity: number; variation?: { attribute: string; value: string }[] }, cartToken?: string) {
  return storeApi<StoreCart>("/cart/add-item", {
    method: "POST",
    headers: cartToken ? { "Cart-Token": cartToken } : undefined,
    body: JSON.stringify(input),
  });
}
