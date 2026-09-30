import { apiJson, apiOptions } from "@/lib/http";
import { getCategories } from "@/lib/products.server";

export function OPTIONS() {
  return apiOptions();
}

export async function GET() {
  return apiJson({ categories: await getCategories() });
}
