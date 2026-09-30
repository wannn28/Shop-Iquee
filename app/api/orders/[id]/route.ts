import { apiJson, apiOptions } from "@/lib/http";
import { ordersStoreFor } from "@/lib/order-store";
import { confirmationTokenMatches, isOrderId, toOrderConfirmation } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { wooConfigured } from "@/lib/woo/rest";

export function OPTIONS() {
  return apiOptions();
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(`order:${clientIp(request)}`, 30, 60 * 1000);
  if (!limited.ok) {
    return apiJson({ error: "Too many order lookups." }, 429);
  }

  const { id } = await context.params;
  if (!isOrderId(id)) {
    return apiJson({ error: "Order not found." }, 404);
  }

  const store = ordersStoreFor(wooConfigured() ? "stripe" : "demo");
  const order = await store.get(id);
  const token = request.headers.get("x-confirmation-token");
  if (!order || !confirmationTokenMatches(order.confirmationToken, token)) {
    return apiJson({ error: "Order not found." }, 404);
  }

  return apiJson({ order: toOrderConfirmation(order) });
}
