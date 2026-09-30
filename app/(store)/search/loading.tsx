import { ProductGridSkeleton } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/Container";

export default function SearchLoading() {
  return (
    <Container className="py-12">
      <div className="h-10 w-40 animate-pulse rounded bg-bg-muted" />
      <div className="mt-6 h-12 animate-pulse rounded-input bg-bg-muted" />
      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </Container>
  );
}
