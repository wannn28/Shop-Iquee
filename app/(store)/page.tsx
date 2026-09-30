import Link from "next/link";

import { ProductGrid } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { buttonClass } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { getCategories, getFeaturedProducts } from "@/lib/products.server";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([getFeaturedProducts(8), getCategories()]);
  const hero = featured.slice(0, 2);

  return (
    <>
      <Container
        className={cn(
          "grid min-h-[60vh] items-center gap-10 py-12 md:py-16 lg:py-20",
          hero.length > 0 && "md:grid-cols-2",
        )}
      >
        <div>
          <p className="type-small text-fg-muted">New season</p>
          <h1 className="type-display mt-4">Everyday objects, considered.</h1>
          <p className="mt-4 max-w-md text-fg-muted">
            Clothing, home, and studio goods in a short catalog. Guest checkout, flat shipping, thirty-day returns.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/products" className={buttonClass({ size: "lg" })}>
              Shop the catalog
            </Link>
            <Link href="/products?sort=newest" className={buttonClass({ size: "md", variant: "secondary" })}>
              New arrivals
            </Link>
          </div>
        </div>
        {hero.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {hero.map((product, index) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="relative aspect-square overflow-hidden rounded-card bg-bg-muted">
                {product.images[0] ? (
                  <ProductImage
                    src={product.images[index === 1 ? 1 : 0]?.src ?? product.images[0].src}
                    alt={product.images[0].alt}
                    sizes="(min-width: 768px) 25vw, 50vw"
                    priority={index === 0}
                  />
                ) : null}
              </Link>
            ))}
          </div>
        ) : null}
      </Container>

      {featured.length > 0 ? (
        <Container className="pb-12 md:pb-16 lg:pb-20">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="type-h2">Featured</h2>
            <Link href="/products" className="type-small text-fg-muted">
              View all
            </Link>
          </div>
          <ProductGrid products={featured} />
        </Container>
      ) : null}

      {categories.length > 0 ? (
        <Container className="pb-12 md:pb-16 lg:pb-20">
          <h2 className="type-h2">Shop by category</h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={`/products?category=${category.slug}`} className="flex min-h-32 flex-col justify-between rounded-card bg-bg-muted p-5">
                  <span className="type-card">{category.name}</span>
                  <span className="type-small text-fg-muted">{category.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      ) : null}

      <Container className="pb-12 md:pb-16 lg:pb-20">
        <ul className="grid gap-4 border-y border-border py-6 md:grid-cols-3">
          {[
            ["Shipping", "Complimentary over $150, otherwise $8."],
            ["Returns", "30 days on unused items."],
            ["Checkout", "Guest checkout. Card details stay in the browser."],
          ].map(([title, body]) => (
            <li key={title}>
              <p className="type-card">{title}</p>
              <p className="mt-1 type-small text-fg-muted">{body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
