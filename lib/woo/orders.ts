import "server-only";

import type { OrderDraft, StoredOrder } from "@/lib/orders";

import { wooRest } from "@/lib/woo/rest";

type WooOrderResponse = {
  id: number;
  status: string;
  currency?: string;
  transaction_id?: string;
  billing?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  meta_data?: { key: string; value: unknown }[];
  line_items?: { name?: string; product_id?: number; variation_id?: number; quantity?: number; price?: number }[];
};

/** Body for POST /wp-json/wc/v3/orders. Pending and unpaid. */
export function wooPendingOrderBody(draft: OrderDraft) {
  const address = draft.shippingAddress;
  const person = {
    first_name: address.firstName,
    last_name: address.lastName,
    address_1: address.line1,
    address_2: address.line2 ?? "",
    city: address.city,
    state: address.region,
    postcode: address.postalCode,
    country: address.country,
  };
  return {
    status: "pending" as const,
    set_paid: false,
    currency: draft.currency,
    billing: { ...person, email: draft.email, phone: draft.phone ?? "" },
    shipping: person,
    line_items: draft.items.map((item) => {
      const lineTotal = (item.unitPrice * item.quantity).toFixed(2);
      const variationId = item.variationId && /^\d+$/.test(item.variationId) ? Number(item.variationId) : undefined;
      return {
        name: item.name,
        product_id: item.productId,
        variation_id: variationId,
        quantity: item.quantity,
        subtotal: lineTotal,
        total: lineTotal,
      };
    }),
    shipping_lines:
      draft.shipping > 0
        ? [{ method_id: "flat_rate", method_title: "Shipping", total: draft.shipping.toFixed(2) }]
        : [],
    meta_data: [
      { key: "_iquee_confirmation_token", value: draft.confirmationToken ?? "" },
      { key: "_iquee_subtotal", value: String(draft.subtotal) },
      { key: "_iquee_shipping", value: String(draft.shipping) },
      { key: "_iquee_total", value: String(draft.total) },
      { key: "_iquee_demo", value: "false" },
    ],
  };
}

export async function createWooPendingOrder(draft: OrderDraft) {
  const created = await wooRest<WooOrderResponse>("/orders", {
    method: "POST",
    body: wooPendingOrderBody(draft),
  });
  if (!Number.isInteger(created.id)) {
    throw new Error("WooCommerce did not return an order id");
  }
  return created.id;
}

export async function updateWooOrderPayment(wooOrderId: number, body: { status: string; set_paid?: boolean; transaction_id?: string }) {
  await wooRest(`/orders/${wooOrderId}`, { method: "PUT", body });
}

export async function readWooOrder(wooOrderId: number): Promise<StoredOrder | null> {
  try {
    const order = await wooRest<WooOrderResponse>(`/orders/${wooOrderId}`);
    return mapWooOrder(order);
  } catch (error) {
    console.warn("WooCommerce order lookup failed", error);
    return null;
  }
}

function meta(order: WooOrderResponse, key: string) {
  const value = order.meta_data?.find((entry) => entry.key === key)?.value;
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function mapWooOrder(order: WooOrderResponse): StoredOrder {
  const billing = order.billing ?? {};
  const total = Number(meta(order, "_iquee_total"));
  const subtotal = Number(meta(order, "_iquee_subtotal"));
  const shipping = Number(meta(order, "_iquee_shipping"));
  const status = order.status === "processing" || order.status === "completed" ? "confirmed" : order.status === "failed" || order.status === "cancelled" ? "failed" : "pending";
  return {
    id: `woo-${order.id}`,
    wooOrderId: order.id,
    email: billing.email ?? "",
    phone: billing.phone,
    createdAt: new Date().toISOString(),
    status,
    demo: false,
    currency: (order.currency ?? "USD").toUpperCase(),
    subtotal: Number.isFinite(subtotal) ? subtotal : 0,
    shipping: Number.isFinite(shipping) ? shipping : 0,
    total: Number.isFinite(total) ? total : 0,
    confirmationToken: meta(order, "_iquee_confirmation_token") || undefined,
    paymentIntentId: meta(order, "_iquee_payment_intent") || order.transaction_id || undefined,
    items: (order.line_items ?? []).map((item) => ({
      name: item.name ?? "Item",
      quantity: item.quantity ?? 1,
      unitPrice: item.price ?? 0,
      attributes: {},
      productId: item.product_id,
      variationId: item.variation_id ? String(item.variation_id) : undefined,
    })),
    shippingAddress: {
      firstName: billing.first_name ?? "",
      lastName: billing.last_name ?? "",
      line1: billing.address_1 ?? "",
      line2: billing.address_2 || undefined,
      city: billing.city ?? "",
      region: billing.state ?? "",
      postalCode: billing.postcode ?? "",
      country: billing.country ?? "",
    },
  };
}
