import { ActiveChips, Filters } from "@/components/plp/Filters";
import { SortSelect } from "@/components/plp/SortSelect";
import { ProductGrid } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { parseProductQuery, queryProducts } from "@/lib/catalog";
import { getCategories, getProducts } from "@/lib/products.server";

export async function ProductListing({
  title,
  eyebrow,
  basePath,
  searchParams,
  mode,
}: {
  title: string;
  eyebrow?: string;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  mode: "catalog" | "search";
}) {
  const query = parseProductQuery(searchParams);
  const [all, categories] = await Promise.all([getProducts(), getCategories()]);
  const awaitingQuery = mode === "search" && !query.q;
  const products = awaitingQuery ? [] : queryProducts(all, query);

  return (
    <Container className="py-12 md:py-16 lg:py-20">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow ? <p className="type-small text-fg-muted">{eyebrow}</p> : null}
          <h1 className="type-h1 mt-2">{title}</h1>
        </div>
        <p className="type-small text-fg-muted">
          {awaitingQuery ? "Enter a search" : `${products.length} ${products.length === 1 ? "product" : "products"}`}
        </p>
      </header>

      {mode === "search" ? (
        <form action="/search" className="mb-8">
          <label htmlFor="search-q" className="sr-only">
            Search
          </label>
          <input
            id="search-q"
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="Search products"
            className="h-12 w-full rounded-input border border-border px-4"
          />
        </form>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:block">
          <details className="rounded-card border border-border p-4 lg:hidden">
            <summary className="type-card cursor-pointer">Filters</summary>
            <div className="mt-4">
              <Filters basePath={basePath} categories={categories} query={query} />
            </div>
          </details>
          <div className="sticky top-24 hidden lg:block">
            <Filters basePath={basePath} categories={categories} query={query} />
          </div>
        </aside>

        <div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ActiveChips basePath={basePath} categories={categories} query={query} />
            <SortSelect value={query.sort ?? "featured"} />
          </div>
          {products.length === 0 ? (
            <EmptyState
              title={awaitingQuery ? "Search the catalog" : query.q ? `No results for "${query.q}"` : "Nothing matches"}
              body={
                awaitingQuery
                  ? "Try a product, material, or category."
                  : "Clear a filter or try another word."
              }
              action={
                awaitingQuery
                  ? undefined
                  : { href: basePath, label: mode === "search" ? "Clear search" : "Clear filters" }
              }
            />
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </Container>
  );
}
