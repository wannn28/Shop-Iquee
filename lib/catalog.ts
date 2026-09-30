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

export function hasActiveFilters(query: ProductQuery) {
  return Boolean(query.q || query.category || query.min != null || query.max != null || query.stock === "instock");
}

export type ListingEmptyState = {
  kind: "prompt" | "empty-catalog" | "no-match";
  status: string;
  title: string;
  body: string;
  action?: { href: string; label: string };
};

export function resolveListingEmpty(input: {
  total: number;
  matchCount: number;
  query: ProductQuery;
  mode: "catalog" | "search";
  basePath: string;
}): ListingEmptyState | null {
  if (input.matchCount > 0) return null;
  if (input.mode === "search" && !input.query.q) {
    return {
      kind: "prompt",
      status: "Enter a search",
      title: "Search the catalog",
      body: "Try a product, material, or category.",
    };
  }
  if (input.total === 0) {
    return {
      kind: "empty-catalog",
      status: "No products yet",
      title: "Catalog is empty",
      body: "Products will appear here once added.",
      action: { href: "/", label: "Home" },
    };
  }
  return {
    kind: "no-match",
    status: "0 products",
    title: input.query.q ? `No results for "${input.query.q}"` : "Nothing matches",
    body: "Clear a filter or try another word.",
    action: {
      href: input.basePath,
      label: input.mode === "search" ? "Clear search" : "Clear filters",
    },
  };
}

export function findVariation(product: Product, selected: Record<string, string>) {
  return product.variations.find((variation) =>
    Object.entries(variation.attributes).every(([name, value]) => selected[name] === value),
  );
}
