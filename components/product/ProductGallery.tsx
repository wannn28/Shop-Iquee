"use client";

import { useState } from "react";

import { ProductImage } from "@/components/product/ProductImage";
import type { ProductImage as ImageType } from "@/lib/types";

export function ProductGallery({ images }: { images: ImageType[] }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];
  if (!current) return null;

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-card bg-bg-muted">
        <ProductImage
          src={current.src}
          alt={current.alt}
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
        />
      </div>
      {images.length > 1 ? (
        <ul className="mt-3 flex gap-2">
          {images.map((image, index) => (
            <li key={image.src}>
              <button
                type="button"
                aria-label={`Show image ${index + 1}`}
                aria-pressed={index === active}
                onClick={() => setActive(index)}
                className={`relative h-16 w-16 overflow-hidden rounded-input border ${
                  index === active ? "border-fg" : "border-border"
                }`}
              >
                <ProductImage src={image.src} alt="" sizes="64px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
