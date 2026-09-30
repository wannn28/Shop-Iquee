import type { Product, StockStatus, Variation } from "@/lib/types";

export type WooRestImage = { src?: string; alt?: string };
export type WooRestCategory = { id?: number; name?: string; slug?: string };
export type WooRestAttribute = {
  name?: string;
  options?: string[];
  option?: string;
  variation?: boolean;
  visible?: boolean;
};

export type WooRestProduct = {
  id: number;
  name: string;
  slug: string;
  type?: string;
  description?: string;
  short_description?: string;
  sku?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  on_sale?: boolean;
  featured?: boolean;
  date_created?: string;
  stock_status?: string;
  stock_quantity?: number | null;
  images?: WooRestImage[];
  categories?: WooRestCategory[];
  attributes?: WooRestAttribute[];
};

export type WooRestVariation = {
  id: number;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  stock_status?: string;
  stock_quantity?: number | null;
  attributes?: WooRestAttribute[];
  image?: WooRestImage;
};

function stockStatus(value: string | undefined): StockStatus {
  if (value === "outofstock" || value === "onbackorder" || value === "instock") return value;
  return "instock";
}

function money(value: string | undefined, fallback = "0.00") {
  if (!value) return fallback;
  return value;
}

export function mapWooVariation(variation: WooRestVariation): Variation {
  const attributes: Record<string, string> = {};
  for (const attribute of variation.attributes ?? []) {
    if (attribute.name && attribute.option) attributes[attribute.name] = attribute.option;
  }
  const sale = variation.sale_price?.trim() ? variation.sale_price : null;
  const regular = money(variation.regular_price, money(variation.price));
  return {
    id: String(variation.id),
    attributes,
    price: money(variation.price, regular),
    regularPrice: regular,
    salePrice: sale,
    stockStatus: stockStatus(variation.stock_status),
    stockQuantity: variation.stock_quantity ?? null,
  };
}

export function mapWooProduct(product: WooRestProduct, variations: WooRestVariation[] = []): Product {
  const regular = money(product.regular_price, money(product.price));
  const sale = product.sale_price?.trim() ? product.sale_price : null;
  const images =
    product.images?.filter((image) => image.src).map((image) => ({
      src: image.src as string,
      alt: image.alt || product.name,
    })) ?? [];

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description?.trim() || product.short_description?.trim() || "",
    shortDescription: product.short_description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || product.name,
    price: money(product.price, sale ?? regular),
    regularPrice: regular,
    salePrice: sale,
    onSale: Boolean(product.on_sale || sale),
    currency: "USD",
    images: images.length > 0 ? images : [{ src: "/products/placeholder.png", alt: product.name }],
    categories: (product.categories ?? []).map((category) => ({
      id: String(category.id ?? category.slug ?? category.name),
      name: category.name ?? "Category",
      slug: category.slug ?? "category",
    })),
    stockStatus: stockStatus(product.stock_status),
    stockQuantity: product.stock_quantity ?? null,
    attributes: (product.attributes ?? [])
      .filter((attribute) => attribute.name && attribute.options?.length)
      .map((attribute) => ({
        name: attribute.name as string,
        options: attribute.options as string[],
      })),
    variations: variations.map(mapWooVariation),
    specs: (product.attributes ?? [])
      .filter((attribute) => attribute.name && attribute.options?.length && attribute.visible !== false)
      .map((attribute) => ({
        label: attribute.name as string,
        value: (attribute.options ?? []).join(", "),
      })),
    featured: Boolean(product.featured),
    sku: product.sku || `WC-${product.id}`,
    createdAt: product.date_created?.slice(0, 10) || "1970-01-01",
  };
}
