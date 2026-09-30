import { ProductGridSkeleton } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/Container";

export default function ProductsLoading() {
  return (
    <Container className="py-12">
      <div className="h-10 w-40 animate-pulse rounded bg-bg-muted" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden h-80 animate-pulse rounded-card bg-bg-muted lg:block" />
        <ProductGridSkeleton />
      </div>
    </Container>
  );
}
