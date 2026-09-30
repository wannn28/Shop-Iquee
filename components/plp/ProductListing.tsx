import { ActiveChips, Filters } from "@/components/plp/Filters";
import { SortSelect } from "@/components/plp/SortSelect";
import { ProductGrid } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasActiveFilters, parseProductQuery, queryProducts, resolveListingEmpty } from "@/lib/catalog";
import { cn } from "@/lib/cn";
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
  const empty = resolveListingEmpty({
    total: all.length,
    matchCount: products.length,
    query,
    mode,
    basePath,
  });
  const catalogEmpty = empty?.kind === "empty-catalog";
  const showToolbar = hasActiveFilters(query) || !catalogEmpty;

  return (
    <Container className="py-12 md:py-16 lg:py-20">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow ? <p className="type-small text-fg-muted">{eyebrow}</p> : null}
          <h1 className="type-h1 mt-2">{title}</h1>
        </div>
        <p className="type-small text-fg-muted">
          {empty
            ? empty.status
            : `${products.length} ${products.length === 1 ? "product" : "products"}`}
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

      <div
        className={cn(
          "flex flex-col gap-8",
          !catalogEmpty && "lg:grid lg:grid-cols-[280px_minmax(0,1fr)]",
        )}
      >
        {catalogEmpty ? null : (
          <aside className={empty ? "order-last lg:order-none" : undefined}>
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
        )}

        <div className="w-full min-w-0">
          {showToolbar ? (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <ActiveChips basePath={basePath} categories={categories} query={query} />
              {catalogEmpty ? null : <SortSelect value={query.sort ?? "featured"} />}
            </div>
          ) : null}
          {empty ? (
            <EmptyState title={empty.title} body={empty.body} action={empty.action} />
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </Container>
  );
}
