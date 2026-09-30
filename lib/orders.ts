import { randomBytes } from "node:crypto";

import type { Order } from "@/lib/types";

export type StoredOrder = Order & {
  paymentIntentId?: string;
};

type Attempt = {
  fingerprint: string;
  orderId: string;
  clientSecret: string | null;
  demo: boolean;
};

type OrderStore = {
  orders: Map<string, StoredOrder>;
  attempts: Map<string, Attempt>;
  inflight: Set<string>;
};

const globalStore = globalThis as typeof globalThis & { __iqueeOrderStore?: OrderStore };

function store(): OrderStore {
  if (!globalStore.__iqueeOrderStore) {
    globalStore.__iqueeOrderStore = {
      orders: new Map(),
      attempts: new Map(),
      inflight: new Set(),
    };
  }
  return globalStore.__iqueeOrderStore;
}

export function newOrderId() {
  return `IQ-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export function isOrderId(id: string) {
  return /^IQ-[A-F0-9]{12}$/.test(id);
}

export function saveOrder(order: StoredOrder) {
  store().orders.set(order.id, order);
  return order;
}

export function getOrder(id: string) {
  return store().orders.get(id) ?? null;
}

export function markOrderPaid(id: string, paymentIntentId: string) {
  const order = store().orders.get(id);
  if (!order || order.demo || order.status === "demo") return null;
  if (order.paymentIntentId && order.paymentIntentId !== paymentIntentId) return null;
  const next: StoredOrder = { ...order, status: "confirmed", paymentIntentId };
  store().orders.set(id, next);
  return next;
}

export function markOrderFailed(id: string) {
  const order = store().orders.get(id);
  if (!order || order.demo || order.status === "demo" || order.status === "confirmed") return null;
  const next: StoredOrder = { ...order, status: "failed" };
  store().orders.set(id, next);
  return next;
}

export function markOrderPending(id: string, paymentIntentId: string) {
  const order = store().orders.get(id);
  if (!order || order.demo || order.status === "confirmed") return null;
  const next: StoredOrder = { ...order, status: "pending", paymentIntentId };
  store().orders.set(id, next);
  return next;
}

export function recallAttempt(key: string) {
  return store().attempts.get(key) ?? null;
}

export function rememberAttempt(key: string, attempt: Attempt) {
  store().attempts.set(key, attempt);
  return attempt;
}

export function claimCheckout(key: string) {
  if (store().inflight.has(key)) return false;
  store().inflight.add(key);
  return true;
}

export function releaseCheckout(key: string) {
  store().inflight.delete(key);
}

export function resetOrderStore() {
  const current = store();
  current.orders.clear();
  current.attempts.clear();
  current.inflight.clear();
}
