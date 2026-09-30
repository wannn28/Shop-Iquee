import { describe, expect, it } from "vitest";

import { hasActiveFilters, parseProductQuery, queryProducts, resolveListingEmpty } from "@/lib/catalog";
import { luhnValid, priceCheckout, validateCheckout } from "@/lib/checkout";
import { products } from "@/lib/fixtures/products";
import { formatPrice, shippingAmount } from "@/lib/money";
import { verifyWooWebhookSignature } from "@/lib/woo/signature";
import { createHmac } from "node:crypto";

describe("catalog query", () => {
  it("filters by category, price, stock, and search", () => {
    const apparel = queryProducts(products, { category: "apparel" });
    expect(apparel.every((product) => product.categories.some((category) => category.slug === "apparel"))).toBe(true);

    const priced = queryProducts(products, { min: 100, max: 150 });
    expect(priced.map((product) => product.slug).sort()).toEqual(["canvas-sneaker", "linen-throw"]);

    const inStock = queryProducts(products, { stock: "instock" });
    expect(inStock.find((product) => product.slug === "studio-lamp")).toBeUndefined();

    const search = queryProducts(products, { q: "merino" });
    expect(search).toHaveLength(1);
    expect(search[0]?.slug).toBe("merino-crew");
  });

  it("uses empty-catalog copy when the store has no products", () => {
    expect(
      resolveListingEmpty({
        total: 0,
        matchCount: 0,
        query: { sort: "featured" },
        mode: "catalog",
        basePath: "/products",
      }),
    ).toEqual({
      kind: "empty-catalog",
      status: "No products yet",
      title: "Catalog is empty",
      body: "Products will appear here once added.",
      action: { href: "/", label: "Home" },
    });

    expect(
      resolveListingEmpty({
        total: 0,
        matchCount: 0,
        query: { category: "apparel", sort: "featured" },
        mode: "catalog",
        basePath: "/products",
      })?.action?.label,
    ).toBe("Home");
  });

  it("keeps filter-empty copy when products exist but nothing matches", () => {
    expect(hasActiveFilters({ sort: "featured" })).toBe(false);
    expect(hasActiveFilters({ category: "apparel", sort: "featured" })).toBe(true);
    expect(
      resolveListingEmpty({
        total: 12,
        matchCount: 0,
        query: { category: "apparel", sort: "featured" },
        mode: "catalog",
        basePath: "/products",
      }),
    ).toMatchObject({
      kind: "no-match",
      status: "0 products",
      title: "Nothing matches",
      action: { href: "/products", label: "Clear filters" },
    });
    expect(
      resolveListingEmpty({
        total: 12,
        matchCount: 4,
        query: { sort: "featured" },
        mode: "catalog",
        basePath: "/products",
      }),
    ).toBeNull();
    expect(
      resolveListingEmpty({
        total: 12,
        matchCount: 0,
        query: { sort: "featured" },
        mode: "search",
        basePath: "/search",
      }),
    ).toMatchObject({ kind: "prompt", title: "Search the catalog" });
  });

  it("sorts by price and parses search params", () => {
    const sorted = queryProducts(products, { sort: "price-asc" });
    expect(Number(sorted[0]?.price)).toBeLessThanOrEqual(Number(sorted.at(-1)?.price));
    expect(parseProductQuery(new URLSearchParams("sort=price-desc&stock=instock&min=10"))).toEqual({
      q: undefined,
      category: undefined,
      min: 10,
      max: undefined,
      stock: "instock",
      sort: "price-desc",
    });
  });
});

describe("checkout pricing", () => {
  it("reprices from the catalog and adds shipping under $150", () => {
    const result = priceCheckout(products, [{ productId: 1001, quantity: 1 }]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.subtotal).toBe(72);
    expect(result.shipping).toBe(8);
    expect(result.total).toBe(80);
  });

  it("merges duplicate lines, caps unknown stock, and caps the order total", () => {
    const split = priceCheckout(products, [
      { productId: 1001, quantity: 9 },
      { productId: 1001, quantity: 9 },
    ]);
    expect(split.ok).toBe(true);
    if (!split.ok) return;
    expect(split.lines).toHaveLength(1);
    expect(split.lines[0]?.quantity).toBe(18);

    const overStock = priceCheckout(products, [
      { productId: 1001, quantity: 10 },
      { productId: 1001, quantity: 10 },
    ]);
    expect(overStock.ok).toBe(false);

    const openStock = { ...products[0]!, id: 4242, stockQuantity: null, variations: [] };
    expect(priceCheckout([openStock], [{ productId: 4242, quantity: 100 }]).ok).toBe(false);
    const capped = priceCheckout([openStock], [{ productId: 4242, quantity: 99 }]);
    expect(capped.ok).toBe(true);

    const expensive = { ...products[0]!, id: 4243, price: "500.00", stockQuantity: 99, variations: [] };
    expect(priceCheckout([expensive], [{ productId: 4243, quantity: 50 }]).ok).toBe(false);
  });

  it("rejects an unknown variant and an out of stock product", () => {
    expect(priceCheckout(products, [{ productId: 1005, quantity: 1 }]).ok).toBe(false);
    expect(priceCheckout(products, [{ productId: 1004, quantity: 1 }]).ok).toBe(false);
    const inkSmall = priceCheckout(products, [{ productId: 1005, variationId: "1005-ink-s", quantity: 1 }]);
    expect(inkSmall.ok).toBe(false);
  });

  it("validates contact fields and a test card number", () => {
    const missing = validateCheckout({ email: "nope", items: [], paymentMethod: "card", shipping: {} });
    expect(missing.ok).toBe(false);
    expect(luhnValid("4242424242424242")).toBe(true);
    expect(luhnValid("4242424242424243")).toBe(false);
  });
});

describe("money and webhooks", () => {
  it("formats USD and waives shipping at the threshold", () => {
    expect(formatPrice(72)).toBe("$72.00");
    expect(shippingAmount(150)).toBe(0);
    expect(shippingAmount(149)).toBe(8);
    expect(shippingAmount(0)).toBe(0);
  });

  it("checks the WooCommerce HMAC signature", () => {
    const secret = "whsec_test";
    const body = JSON.stringify({ id: 1 });
    const signature = createHmac("sha256", secret).update(body, "utf8").digest("base64");
    expect(verifyWooWebhookSignature(body, signature, secret)).toBe(true);
    expect(verifyWooWebhookSignature(body, `${signature}x`, secret)).toBe(false);
    expect(verifyWooWebhookSignature(body, null, secret)).toBe(false);
  });
});
