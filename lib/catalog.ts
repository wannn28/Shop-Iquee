import type { Product, ProductQuery, ProductSort } from "@/lib/types";

const SORTS: ProductSort[] = ["featured", "newest", "price-asc", "price-desc"];

function one(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string,
) {
  if (input instanceof URLSearchParams) {
    return input.get(key) ?? undefined;
  }
  const value = input[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseProductQuery(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): ProductQuery {
  const q = one(input, "q")?.trim();
  const category = one(input, "category")?.trim();
  const minRaw = one(input, "min");
  const maxRaw = one(input, "max");
  const min = minRaw != null && minRaw !== "" ? Number(minRaw) : undefined;
  const max = maxRaw != null && maxRaw !== "" ? Number(maxRaw) : undefined;
  const sortRaw = one(input, "sort");
  const sort = SORTS.includes(sortRaw as ProductSort) ? (sortRaw as ProductSort) : "featured";

  return {
    q: q || undefined,
    category: category || undefined,
    min: min != null && Number.isFinite(min) ? min : undefined,
    max: max != null && Number.isFinite(max) ? max : undefined,
    stock: one(input, "stock") === "instock" ? "instock" : undefined,
    sort,
  };
}

export function toSearch(query: ProductQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.min != null) params.set("min", String(query.min));
  if (query.max != null) params.set("max", String(query.max));
  if (query.stock === "instock") params.set("stock", "instock");
  if (query.sort && query.sort !== "featured") params.set("sort", query.sort);
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function queryProducts(list: Product[], query: ProductQuery) {
  const filtered = list.filter((product) => {
    if (query.category && !product.categories.some((category) => category.slug === query.category)) {
      return false;
    }
    const price = Number(product.price);
    if (query.min != null && price < query.min) return false;
    if (query.max != null && price > query.max) return false;
    if (query.stock === "instock" && product.stockStatus !== "instock") return false;
    if (query.q) {
      const haystack = [
        product.name,
        product.shortDescription,
        product.sku,
        ...product.categories.map((category) => category.name),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query.q.toLowerCase())) return false;
    }
    return true;
  });

  const sort = query.sort ?? "featured";
  return [...filtered].sort((a, b) => {
    if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
    if (sort === "price-asc") return Number(a.price) - Number(b.price);
    if (sort === "price-desc") return Number(b.price) - Number(a.price);
    return Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name);
  });
}

export function findVariation(product: Product, selected: Record<string, string>) {
  return product.variations.find((variation) =>
    Object.entries(variation.attributes).every(([name, value]) => selected[name] === value),
  );
}
