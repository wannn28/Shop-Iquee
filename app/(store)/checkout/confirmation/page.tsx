import type { Metadata } from "next";
import { Suspense } from "react";

import { Confirmation } from "@/components/checkout/Confirmation";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Order status",
};

export default function ConfirmationPage() {
  return (
    <Container className="py-12 md:py-16">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-card bg-bg-muted" />}>
        <Confirmation />
      </Suspense>
    </Container>
  );
}
