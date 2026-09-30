import { parseProductQuery, queryProducts } from "@/lib/catalog";
import { apiJson, apiOptions } from "@/lib/http";
import { getProducts } from "@/lib/products.server";
import { wooConfigured } from "@/lib/woo/rest";

export function OPTIONS() {
  return apiOptions();
}

export async function GET(request: Request) {
  const query = parseProductQuery(new URL(request.url).searchParams);
  const products = queryProducts(await getProducts(), query);
  return apiJson({ source: wooConfigured() ? "woocommerce" : "fixture", products, query });
}
