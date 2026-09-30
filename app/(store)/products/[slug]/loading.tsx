import { Container } from "@/components/ui/Container";

export default function ProductLoading() {
  return (
    <Container className="py-12">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-card bg-bg-muted" />
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded bg-bg-muted" />
          <div className="h-10 w-2/3 animate-pulse rounded bg-bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-bg-muted" />
          <div className="h-12 w-full animate-pulse rounded bg-bg-muted" />
        </div>
      </div>
    </Container>
  );
}
