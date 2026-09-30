"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Price } from "@/components/product/Price";
import { QtyStepper } from "@/components/product/QtyStepper";
import { findVariation } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { useCart } from "@/store/cart";

export function AddToCart({ product }: { product: Product }) {
  const addItem = useCart((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const variation = useMemo(
    () => (product.variations.length ? findVariation(product, selected) : undefined),
    [product, selected],
  );

  const missing = product.attributes.filter((attribute) => !selected[attribute.name]);
  const stockStatus = variation ? variation.stockStatus : product.stockStatus;
  const stockQuantity = variation ? variation.stockQuantity : product.stockQuantity;
  const soldOut = stockStatus === "outofstock" || stockQuantity === 0;
  const price = variation?.price ?? product.price;
  const regularPrice = variation?.regularPrice ?? product.regularPrice;
  const onSale = variation ? Boolean(variation.salePrice) : product.onSale;
  const needsOptions = product.variations.length > 0 && (!variation || missing.length > 0);

  function add() {
    if (needsOptions) {
      setError(`Select ${missing.map((attribute) => attribute.name.toLowerCase()).join(" and ")}.`);
      return;
    }
    if (soldOut) {
      setError("This item is out of stock.");
      return;
    }
    setError(null);
    addItem({
      productId: product.id,
      variationId: variation?.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0]?.src ?? "/products/placeholder.png",
      unitPrice: Number(price),
      currency: product.currency,
      quantity,
      attributes: variation?.attributes ?? {},
      stockQuantity,
    });
  }

  const stockLabel =
    stockStatus === "outofstock"
      ? "Out of stock"
      : stockStatus === "onbackorder"
        ? "On backorder"
        : stockQuantity != null
          ? `In stock · ${stockQuantity} ready to ship`
          : "In stock";

  const stockClass =
    stockStatus === "outofstock" ? "text-error" : stockStatus === "onbackorder" ? "text-warning" : "text-success";

  return (
    <div>
      <Price price={price} regularPrice={regularPrice} onSale={onSale} currency={product.currency} />
      <p className={`mt-2 type-small ${stockClass}`}>{stockLabel}</p>

      {product.attributes.map((attribute) => (
        <fieldset key={attribute.name} className="mt-5">
          <legend className="type-small text-fg">{attribute.name}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {attribute.options.map((option) => {
              const pressed = selected[attribute.name] === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => {
                    setSelected((current) => ({ ...current, [attribute.name]: option }));
                    setError(null);
                  }}
                  className={`h-11 rounded-button border px-4 text-sm ${
                    pressed ? "border-fg bg-fg text-primary-fg" : "border-border bg-bg"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="mt-5 hidden items-center gap-3 md:flex">
        <QtyStepper
          value={quantity}
          max={stockQuantity ?? undefined}
          onChange={setQuantity}
        />
        <Button size="lg" className="min-w-48 flex-1" onClick={add} disabled={soldOut && !needsOptions}>
          {soldOut && !needsOptions ? "Sold out" : "Add to cart"}
        </Button>
      </div>
      {error ? (
        <p className="mt-2 type-small text-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg p-4 md:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3">
          <QtyStepper value={quantity} max={stockQuantity ?? undefined} onChange={setQuantity} />
          <Button size="lg" className="flex-1" onClick={add} disabled={soldOut && !needsOptions}>
            {soldOut && !needsOptions ? "Sold out" : "Add to cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
