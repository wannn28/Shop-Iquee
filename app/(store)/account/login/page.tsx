import type { Metadata } from "next";

import { AuthForm } from "@/components/account/AuthForm";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Container className="py-12 md:py-16">
      <AuthForm mode="login" />
    </Container>
  );
}
