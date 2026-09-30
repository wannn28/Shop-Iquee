import { apiJson, apiOptions } from "@/lib/http";
import { getOrder, isOrderId } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";

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

  const order = getOrder(id);
  if (!order) return apiJson({ error: "Order not found." }, 404);
  return apiJson({ order });
}
