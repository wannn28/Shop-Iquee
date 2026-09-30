"use client";

import Link from "next/link";

import { buttonClass } from "@/components/ui/Button";
import { Price } from "@/components/product/Price";
import { ProductImage } from "@/components/product/ProductImage";
import type { Product } from "@/lib/types";
import { useCart } from "@/store/cart";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((state) => state.addItem);
  const soldOut = product.stockStatus === "outofstock";
  const variable = product.variations.length > 0;
  const image = product.images[0];
  const hover = product.images[1];

  return (
    <article className="group">
      <div className="relative">
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative aspect-square overflow-hidden rounded-card bg-bg-muted">
            {image ? (
              <ProductImage
                src={image.src}
                alt={image.alt}
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              />
            ) : null}
            {hover ? (
              <ProductImage
                src={hover.src}
                alt=""
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            ) : null}
            {product.onSale ? (
              <span className="absolute left-3 top-3 rounded-pill bg-sale px-2 py-1 text-xs font-medium text-white">
                Sale
              </span>
            ) : null}
            {soldOut ? (
              <span className="absolute right-3 top-3 rounded-pill bg-fg px-2 py-1 text-xs font-medium text-primary-fg">
                Sold out
              </span>
            ) : null}
          </div>
        </Link>
        <div className="pointer-events-none absolute inset-x-2 bottom-2 translate-y-2 opacity-0 transition duration-200 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
          {variable ? (
            <Link href={`/products/${product.slug}`} className={buttonClass({ className: "w-full" })}>
              Choose options
            </Link>
          ) : soldOut ? null : (
            <button
              type="button"
              className={buttonClass({ className: "w-full" })}
              onClick={() =>
                addItem({
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  image: image?.src ?? "/products/placeholder.png",
                  unitPrice: Number(product.price),
                  currency: product.currency,
                  attributes: {},
                  stockQuantity: product.stockQuantity,
                })
              }
            >
              Add to cart
            </button>
          )}
        </div>
      </div>
      <Link href={`/products/${product.slug}`} className="mt-3 block">
        <h3 className="type-card line-clamp-2">{product.name}</h3>
      </Link>
      <Price
        className="mt-1"
        price={product.price}
        regularPrice={product.regularPrice}
        onSale={product.onSale}
        currency={product.currency}
      />
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square rounded-card bg-bg-muted" />
      <div className="mt-3 h-4 w-3/4 rounded bg-bg-muted" />
      <div className="mt-2 h-4 w-1/3 rounded bg-bg-muted" />
    </div>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
