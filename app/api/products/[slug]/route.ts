import { apiJson, apiOptions } from "@/lib/http";
import { getProductBySlug } from "@/lib/products.server";

export function OPTIONS() {
  return apiOptions();
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const product = await getProductBySlug(slug);
  if (!product) return apiJson({ error: "Product not found" }, 404);
  return apiJson({ product });
}
