import Link from "next/link";

import { buttonClass } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function NotFoundState() {
  return (
    <Container className="py-20">
      <p className="type-small text-fg-muted">404</p>
      <h1 className="type-display mt-3">This page is not in the catalog.</h1>
      <p className="mt-4 max-w-md text-fg-muted">The link may be out of date, or the product may have been retired.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className={buttonClass({ size: "lg" })}>
          Home
        </Link>
        <Link href="/products" className={buttonClass({ size: "lg", variant: "secondary" })}>
          Browse the catalog
        </Link>
      </div>
    </Container>
  );
}
