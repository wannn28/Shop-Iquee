"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Input";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const title = mode === "login" ? "Sign in" : "Create account";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      name: String(form.get("name") ?? ""),
    };
    if (payload.password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/account/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not continue.");
        setPending(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-[640px]">
        <h1 className="type-h1">{title}</h1>
        <p className="mt-4 text-fg-muted">
          This environment uses a stub session. Sample order history is available until WooCommerce customers are
          connected.
        </p>
        <Link href="/account/orders" className="mt-6 inline-block type-small underline">
          View sample orders
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-[640px] space-y-4" noValidate>
      <h1 className="type-h1">{title}</h1>
      <p className="type-small text-fg-muted">Guest checkout does not require an account.</p>
      {mode === "register" ? <Field label="Name" name="name" autoComplete="name" required /> : null}
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
      {error ? (
        <p className="type-small text-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Please wait…" : title}
      </Button>
      <p className="type-small text-fg-muted">
        {mode === "login" ? (
          <Link href="/account/register" className="underline">
            Create an account
          </Link>
        ) : (
          <Link href="/account/login" className="underline">
            Already have an account
          </Link>
        )}
      </p>
    </form>
  );
}
