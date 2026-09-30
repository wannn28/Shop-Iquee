import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <Container className="py-12 md:py-16">
      <h1 className="type-h1 mb-8">Checkout</h1>
      <CheckoutForm />
    </Container>
  );
}
