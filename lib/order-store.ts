import "server-only";

import {
  getOrder,
  newConfirmationToken,
  newOrderId,
  saveOrder,
  type OrderDraft,
  type StoredOrder,
} from "@/lib/orders";
import { createWooPendingOrder, readWooOrder, updateWooOrderPayment } from "@/lib/woo/orders";
import { wooConfigured } from "@/lib/woo/rest";

/**
 * Order persistence seam.
 * `memory` keeps the record in this process only. That path is the explicit demo.
 * `woocommerce` creates a pending wc/v3 order before any PaymentIntent.
 */
export type OrdersStore = {
  readonly kind: "memory" | "woocommerce";
  create(draft: OrderDraft): Promise<StoredOrder>;
  get(id: string): Promise<StoredOrder | null>;
  attachPayment(id: string, paymentIntentId: string): Promise<StoredOrder | null>;
  markPaid(id: string, paymentIntentId: string): Promise<StoredOrder | null>;
  markFailed(id: string): Promise<StoredOrder | null>;
};

function withToken(draft: OrderDraft, id: string, wooOrderId?: number): StoredOrder {
  return saveOrder({
    ...draft,
    id,
    wooOrderId,
    confirmationToken: draft.confirmationToken ?? newConfirmationToken(),
  });
}

async function syncWooStatus(order: StoredOrder, body: { status: string; set_paid?: boolean; transaction_id?: string }) {
  if (!order.wooOrderId) return;
  await updateWooOrderPayment(order.wooOrderId, body);
}

export function ordersStoreFor(mode: "demo" | "stripe"): OrdersStore {
  const durable = mode === "stripe" && wooConfigured();
  return {
    kind: durable ? "woocommerce" : "memory",
    async create(draft) {
      if (!durable || draft.demo) {
        return withToken({ ...draft, demo: true, status: "demo" }, newOrderId());
      }
      const confirmationToken = draft.confirmationToken ?? newConfirmationToken();
      const wooOrderId = await createWooPendingOrder({ ...draft, confirmationToken, demo: false, status: "pending" });
      return withToken({ ...draft, confirmationToken, demo: false, status: "pending" }, `woo-${wooOrderId}`, wooOrderId);
    },
    async get(id) {
      const cached = getOrder(id);
      if (cached) return cached;
      if (!id.startsWith("woo-")) return null;
      const wooOrderId = Number(id.slice(4));
      if (!Number.isInteger(wooOrderId)) return null;
      const remote = await readWooOrder(wooOrderId);
      return remote ? saveOrder(remote) : null;
    },
    async attachPayment(id, paymentIntentId) {
      const order = getOrder(id);
      if (!order || order.demo || order.status === "confirmed") return null;
      if (order.wooOrderId) {
        await updateWooOrderPayment(order.wooOrderId, { status: "pending", set_paid: false, transaction_id: paymentIntentId });
      }
      return saveOrder({ ...order, status: "pending", paymentIntentId });
    },
    async markPaid(id, paymentIntentId) {
      const cached = getOrder(id);
      const order =
        cached ??
        (id.startsWith("woo-") ? await readWooOrder(Number(id.slice(4))) : null);
      if (!order || order.demo || order.status === "demo") return null;
      if (order.paymentIntentId && order.paymentIntentId !== paymentIntentId) return null;
      await syncWooStatus(order, { status: "processing", set_paid: true, transaction_id: paymentIntentId });
      return saveOrder({ ...order, status: "confirmed", paymentIntentId });
    },
    async markFailed(id) {
      const order = getOrder(id);
      if (!order || order.demo || order.status === "demo" || order.status === "confirmed") return null;
      await syncWooStatus(order, { status: "failed", set_paid: false });
      return saveOrder({ ...order, status: "failed" });
    },
  };
}
