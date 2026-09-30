import type { Metadata } from "next";

import { ProductListing } from "@/components/plp/ProductListing";

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  return (
    <ProductListing
      title={q ? `Results for "${q}"` : "Search"}
      eyebrow="Catalog"
      basePath="/search"
      searchParams={params}
      mode="search"
    />
  );
}
