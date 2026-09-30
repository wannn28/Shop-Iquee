import Link from "next/link";

import { toSearch } from "@/lib/catalog";
import type { Category, ProductQuery } from "@/lib/types";

export function Filters({
  basePath,
  categories,
  query,
}: {
  basePath: string;
  categories: Category[];
  query: ProductQuery;
}) {
  return (
    <form action={basePath} method="get" className="space-y-8">
      {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
      {query.category ? <input type="hidden" name="category" value={query.category} /> : null}
      {query.sort && query.sort !== "featured" ? <input type="hidden" name="sort" value={query.sort} /> : null}

      <fieldset>
        <legend className="type-card">Category</legend>
        <ul className="mt-3 space-y-2">
          <li>
            <Link
              href={`${basePath}${toSearch({ ...query, category: undefined })}`}
              className={`type-small ${query.category ? "text-fg-muted" : "font-medium text-fg"}`}
              aria-current={query.category ? undefined : "true"}
            >
              All
            </Link>
          </li>
          {categories.map((category) => {
            const active = query.category === category.slug;
            return (
              <li key={category.slug}>
                <Link
                  href={`${basePath}${toSearch({ ...query, category: category.slug })}`}
                  className={`type-small ${active ? "font-medium text-fg" : "text-fg-muted"}`}
                  aria-current={active ? "true" : undefined}
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="type-card">Price</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="type-small text-fg-muted">
            Min
            <input
              name="min"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={query.min ?? ""}
              className="mt-1 h-11 w-full rounded-input border border-border px-3 text-fg"
            />
          </label>
          <label className="type-small text-fg-muted">
            Max
            <input
              name="max"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={query.max ?? ""}
              className="mt-1 h-11 w-full rounded-input border border-border px-3 text-fg"
            />
          </label>
        </div>
      </fieldset>

      <label className="flex min-h-11 items-center gap-2 type-small">
        <input type="checkbox" name="stock" value="instock" defaultChecked={query.stock === "instock"} />
        In stock
      </label>

      <button type="submit" className="h-11 w-full rounded-button border border-border text-sm font-medium">
        Apply filters
      </button>
    </form>
  );
}

export function ActiveChips({ basePath, query }: { basePath: string; query: ProductQuery }) {
  const chips: { label: string; href: string }[] = [];
  if (query.category) {
    chips.push({
      label: query.category,
      href: `${basePath}${toSearch({ ...query, category: undefined })}`,
    });
  }
  if (query.min != null || query.max != null) {
    const label =
      query.min != null && query.max != null
        ? `$${query.min}–$${query.max}`
        : query.min != null
          ? `From $${query.min}`
          : `Up to $${query.max}`;
    chips.push({
      label,
      href: `${basePath}${toSearch({ ...query, min: undefined, max: undefined })}`,
    });
  }
  if (query.stock === "instock") {
    chips.push({
      label: "In stock",
      href: `${basePath}${toSearch({ ...query, stock: undefined })}`,
    });
  }
  if (query.q) {
    chips.push({
      label: `“${query.q}”`,
      href: `${basePath}${toSearch({ ...query, q: undefined })}`,
    });
  }
  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li key={chip.label}>
          <Link
            href={chip.href}
            className="inline-flex h-9 items-center gap-2 rounded-pill border border-border px-3 type-small"
          >
            {chip.label}
            <span aria-hidden="true">×</span>
            <span className="sr-only">Remove {chip.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
