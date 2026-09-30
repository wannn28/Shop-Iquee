"use client";

import { useState } from "react";

import { shippingCopy } from "@/lib/content";
import { plainText } from "@/lib/money";
import type { Product } from "@/lib/types";

const tabs = ["Description", "Specs", "Shipping"] as const;

export function ProductTabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Description");
  const paragraphs = product.description
    .split(/\n\n+/)
    .map((paragraph) => plainText(paragraph))
    .filter(Boolean);

  return (
    <div>
      <div className="flex gap-6 border-b border-border" role="tablist" aria-label="Product details">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={`-mb-px h-11 border-b-2 text-sm ${
              tab === item ? "border-fg font-medium text-fg" : "border-transparent text-fg-muted"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="max-w-3xl py-6" role="tabpanel">
        {tab === "Description" ? (
          <div className="space-y-4 text-fg">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : null}
        {tab === "Specs" ? (
          <dl className="divide-y divide-border border-y border-border">
            {product.specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-2 gap-4 py-3">
                <dt className="type-small text-fg-muted">{spec.label}</dt>
                <dd className="type-small">{spec.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {tab === "Shipping" ? <p className="text-fg">{shippingCopy}</p> : null}
      </div>
    </div>
  );
}
