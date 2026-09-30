import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/product/AddToCart";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductTabs } from "@/components/product/ProductTabs";
import { Container } from "@/components/ui/Container";
import { getProductBySlug } from "@/lib/products.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };
  return { title: product.name, description: product.shortDescription };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <Container className="py-8 pb-28 md:py-12 md:pb-16">
      <nav className="type-small text-fg-muted" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/products">Catalog</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-fg">{product.name}</span>
      </nav>
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} />
        <div>
          <p className="type-small text-fg-muted">{product.categories.map((category) => category.name).join(" / ")}</p>
          <h1 className="type-h1 mt-2">{product.name}</h1>
          <p className="mt-4 max-w-xl text-fg-muted">{product.shortDescription}</p>
          <div className="mt-6">
            <AddToCart product={product} />
          </div>
          <p className="mt-4 type-small text-fg-muted">SKU {product.sku}</p>
        </div>
      </div>
      <div className="mt-12">
        <ProductTabs product={product} />
      </div>
    </Container>
  );
}
