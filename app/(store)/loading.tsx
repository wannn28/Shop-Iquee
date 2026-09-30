import { ProductGridSkeleton } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/Container";

export default function StoreLoading() {
  return (
    <Container className="py-12">
      <div className="h-10 w-48 animate-pulse rounded bg-bg-muted" />
      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </Container>
  );
}
