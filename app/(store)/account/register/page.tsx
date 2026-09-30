import type { Metadata } from "next";

import { AuthForm } from "@/components/account/AuthForm";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <Container className="py-12 md:py-16">
      <AuthForm mode="register" />
    </Container>
  );
}
