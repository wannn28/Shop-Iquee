import "server-only";

import { cache } from "react";

import { categories as fixtureCategories, products as fixtureProducts } from "@/lib/fixtures/products";
import type { Category, Product } from "@/lib/types";
import { mapWooProduct, type WooRestProduct, type WooRestVariation } from "@/lib/woo/map";
import { wooConfigured, wooRest } from "@/lib/woo/rest";

async function loadRemoteProducts(): Promise<Product[] | null> {
  if (!wooConfigured()) return null;
  try {
    const list = await wooRest<WooRestProduct[]>("/products?per_page=100&status=publish");
    return await Promise.all(
      list.map(async (product) => {
        if (product.type !== "variable") return mapWooProduct(product);
        try {
          const variations = await wooRest<WooRestVariation[]>(
            `/products/${product.id}/variations?per_page=100`,
          );
          return mapWooProduct(product, variations);
        } catch (error) {
          console.warn(`WooCommerce variations failed for ${product.id}`, error);
          return mapWooProduct(product);
        }
      }),
    );
  } catch (error) {
    console.warn("WooCommerce catalog unavailable, using fixtures.", error);
    return null;
  }
}

export const getProducts = cache(async (): Promise<Product[]> => {
  const remote = await loadRemoteProducts();
  return remote ?? fixtureProducts;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!wooConfigured()) return fixtureCategories;
  try {
    const remote = await wooRest<
      { id: number; name: string; slug: string; description?: string }[]
    >("/products/categories?per_page=100&hide_empty=true");
    return remote.map((category) => ({
      id: String(category.id),
      name: category.name,
      slug: category.slug,
      description: category.description?.replace(/<[^>]+>/g, " ").trim() || "",
    }));
  } catch (error) {
    console.warn("WooCommerce categories unavailable, using fixtures.", error);
    return fixtureCategories;
  }
});

export async function getProductBySlug(slug: string) {
  const products = await getProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getFeaturedProducts(limit = 8) {
  const products = await getProducts();
  return products.filter((product) => product.featured).slice(0, limit);
}
