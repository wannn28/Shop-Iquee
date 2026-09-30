"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-20">
      <h1 className="type-h1">Something went wrong</h1>
      <p className="mt-3 max-w-md text-fg-muted">This page could not be loaded. The rest of the shop is still available.</p>
      <Button size="lg" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </Container>
  );
}
