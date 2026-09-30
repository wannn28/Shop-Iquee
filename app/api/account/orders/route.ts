import { sampleOrders } from "@/lib/fixtures/orders";
import { apiJson, apiOptions } from "@/lib/http";

export function OPTIONS() {
  return apiOptions();
}

export function GET() {
  return apiJson({ mode: "stub", orders: sampleOrders });
}
