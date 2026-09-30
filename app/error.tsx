"use client";

import { useEffect } from "react";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function RootError({
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
      <p className="mt-3 max-w-md text-fg-muted">The page failed to load. Try again, or return home.</p>
      <div className="mt-6 flex gap-3">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <Link href="/" className="inline-flex h-12 items-center rounded-button border border-border px-5">
          Home
        </Link>
      </div>
    </Container>
  );
}
