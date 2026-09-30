import type { Metadata } from "next";

import { ProductListing } from "@/components/plp/ProductListing";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the iquee catalog.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <ProductListing
      title="Catalog"
      eyebrow="Shop"
      basePath="/products"
      searchParams={params}
      mode="catalog"
    />
  );
}
