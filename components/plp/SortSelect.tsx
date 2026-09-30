"use client";

import { usePathname, useRouter } from "next/navigation";

import type { ProductSort } from "@/lib/types";

const options: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
];

export function SortSelect({ value }: { value: ProductSort }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="type-small text-fg-muted">
      <span className="sr-only">Sort</span>
      <select
        value={value}
        className="h-11 rounded-input border border-border bg-bg px-3 text-fg"
        onChange={(event) => {
          const params = new URLSearchParams(window.location.search);
          const next = event.target.value;
          if (next === "featured") params.delete("sort");
          else params.set("sort", next);
          const query = params.toString();
          router.push(query ? `${pathname}?${query}` : pathname);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
