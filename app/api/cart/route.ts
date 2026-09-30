import { apiJson, apiOptions } from "@/lib/http";
import { getProducts } from "@/lib/products.server";
import { addStoreCartItem, getStoreCart, storeApiConfigured } from "@/lib/woo/store-api";

export function OPTIONS() {
  return apiOptions();
}

const emptyTotals = {
  total_items: "0",
  total_shipping: "0",
  total_price: "0",
  currency_code: "USD",
  currency_minor_unit: 2,
};

export async function GET(request: Request) {
  const token = request.headers.get("cart-token") ?? undefined;
  if (token && storeApiConfigured()) {
    try {
      const cart = await getStoreCart(token);
      return apiJson({ mode: "store-api", cart });
    } catch (error) {
      console.warn("Store API cart read failed", error);
      return apiJson({ mode: "store-api", error: "Store API cart request failed." }, 502);
    }
  }

  return apiJson({
    mode: "stub",
    items: [],
    totals: emptyTotals,
    note: "Cart UI state is kept in Zustand. Pass Cart-Token to sync with wc/store/v1 when WC_BASE_URL is set.",
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { id?: number; quantity?: number; variationId?: string }
    | null;
  const id = Number(body?.id);
  const quantity = Number(body?.quantity ?? 1);
  if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity < 1) {
    return apiJson({ error: "Send an integer id and quantity." }, 400);
  }

  const token = request.headers.get("cart-token") ?? undefined;
  if (token && storeApiConfigured()) {
    try {
      const cart = await addStoreCartItem({ id, quantity }, token);
      return apiJson({ mode: "store-api", cart });
    } catch (error) {
      console.warn("Store API add-item failed", error);
      return apiJson({ mode: "store-api", error: "Store API cart update failed." }, 502);
    }
  }

  const product = (await getProducts()).find((entry) => entry.id === id);
  if (!product) return apiJson({ error: "Unknown product." }, 404);

  return apiJson({
    mode: "stub",
    items: [
      {
        key: `${product.id}:stub`,
        id: product.id,
        quantity,
        name: product.name,
        variationId: body?.variationId,
        prices: {
          price: String(Math.round(Number(product.price) * 100)),
          currency_code: product.currency,
          currency_minor_unit: 2,
        },
      },
    ],
    totals: {
      ...emptyTotals,
      total_items: String(Math.round(Number(product.price) * quantity * 100)),
      total_price: String(Math.round(Number(product.price) * quantity * 100)),
    },
  });
}
