import "server-only";

import { NextResponse } from "next/server";

import { siteUrl } from "@/lib/site";

/**
 * Browser calls stay on the storefront origin (https://store.iquee.tech).
 * WooCommerce at https://woo.iquee.tech is reached only from the server.
 */
export function apiHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": siteUrl(),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Cart-Token, Idempotency-Key, X-Confirmation-Token",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
}

export function apiJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: apiHeaders() });
}

export function apiOptions() {
  return new NextResponse(null, { status: 204, headers: apiHeaders() });
}
