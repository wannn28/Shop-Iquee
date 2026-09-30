"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ExpressPay } from "@/components/checkout/ExpressPay";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Input";
import { luhnValid, validateCheckout } from "@/lib/checkout";
import type { Order } from "@/lib/types";
import { useCart } from "@/store/cart";

const ORDER_KEY = "iquee-order";

export function CheckoutForm() {
  const router = useRouter();
  const items = useCart((state) => state.items);
  const clear = useCart((state) => state.clear);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [card, setCard] = useState({ name: "", number: "", exp: "", cvc: "" });

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        body="Add something from the catalog before checkout."
        action={{ href: "/products", label: "Browse the catalog" }}
      />
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      paymentMethod: "card" as const,
      shipping: {
        firstName: String(form.get("firstName") ?? ""),
        lastName: String(form.get("lastName") ?? ""),
        line1: String(form.get("line1") ?? ""),
        line2: String(form.get("line2") ?? ""),
        city: String(form.get("city") ?? ""),
        region: String(form.get("region") ?? ""),
        postalCode: String(form.get("postalCode") ?? ""),
        country: String(form.get("country") ?? ""),
      },
      items: items.map((item) => ({
        productId: item.productId,
        variationId: item.variationId,
        quantity: item.quantity,
      })),
    };

    const cardErrors: Record<string, string> = {};
    if (card.name.trim().length < 2) cardErrors.cardName = "Enter the name on the card.";
    if (!luhnValid(card.number)) cardErrors.cardNumber = "Enter a valid card number.";
    if (!/^\d{2}\s*\/\s*\d{2}$/.test(card.exp.trim())) cardErrors.cardExp = "Use MM / YY.";
    if (!/^\d{3,4}$/.test(card.cvc.trim())) cardErrors.cardCvc = "Enter the security code.";

    const validated = validateCheckout(payload);
    const nextErrors = {
      ...(validated.ok ? {} : validated.fields),
      ...cardErrors,
    };
    setErrors(nextErrors);
    if (!validated.ok || Object.keys(cardErrors).length > 0) return;

    setPending(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        order?: Order;
        error?: string;
        fields?: Record<string, string>;
      };
      if (!response.ok || !data.order) {
        setErrors(data.fields ?? { form: data.error ?? "Checkout could not be completed." });
        setPending(false);
        return;
      }
      sessionStorage.setItem(`${ORDER_KEY}:${data.order.id}`, JSON.stringify(data.order));
      clear();
      router.push(`/checkout/confirmation?order=${data.order.id}`);
    } catch {
      setErrors({ form: "Network error. Try again." });
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,640px)_320px] lg:justify-between" noValidate>
      <div className="space-y-8">
        <ExpressPay />
        {errors.form ? (
          <p className="rounded-card border border-error px-4 py-3 type-small text-error" role="alert">
            {errors.form}
          </p>
        ) : null}
        {errors.items ? (
          <p className="type-small text-error" role="alert">
            {errors.items}
          </p>
        ) : null}

        <section className="space-y-4">
          <h2 className="type-h2">Contact</h2>
          <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} required />
          <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" error={errors.phone} />
        </section>

        <section className="space-y-4">
          <h2 className="type-h2">Shipping</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" name="firstName" autoComplete="given-name" error={errors.firstName} required />
            <Field label="Last name" name="lastName" autoComplete="family-name" error={errors.lastName} required />
          </div>
          <Field label="Address" name="line1" autoComplete="address-line1" error={errors.line1} required />
          <Field label="Apartment, suite (optional)" name="line2" autoComplete="address-line2" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" name="city" autoComplete="address-level2" error={errors.city} required />
            <Field label="Region" name="region" autoComplete="address-level1" error={errors.region} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Postal code" name="postalCode" autoComplete="postal-code" error={errors.postalCode} required />
            <div>
              <label htmlFor="country" className="type-small">
                Country
              </label>
              <select
                id="country"
                name="country"
                defaultValue="US"
                aria-invalid={errors.country ? true : undefined}
                className={`mt-1 h-11 w-full rounded-input border bg-bg px-3 ${errors.country ? "border-error" : "border-border"}`}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
              </select>
              {errors.country ? <p className="mt-1 type-small text-error">{errors.country}</p> : null}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="type-h2">Payment</h2>
          <p className="type-small text-fg-muted">
            Card details stay in the browser. Demo checkout confirms the order without a charge until Stripe is configured.
          </p>
          <Field
            label="Name on card"
            name="cardName"
            autoComplete="cc-name"
            value={card.name}
            onChange={(event) => setCard((current) => ({ ...current, name: event.target.value }))}
            error={errors.cardName}
          />
          <Field
            label="Card number"
            name="cardNumber"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            value={card.number}
            onChange={(event) => setCard((current) => ({ ...current, number: event.target.value }))}
            error={errors.cardNumber}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Expiry"
              name="cardExp"
              autoComplete="cc-exp"
              placeholder="MM / YY"
              value={card.exp}
              onChange={(event) => setCard((current) => ({ ...current, exp: event.target.value }))}
              error={errors.cardExp}
            />
            <Field
              label="CVC"
              name="cardCvc"
              inputMode="numeric"
              autoComplete="cc-csc"
              value={card.cvc}
              onChange={(event) => setCard((current) => ({ ...current, cvc: event.target.value }))}
              error={errors.cardCvc}
            />
          </div>
        </section>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Placing order…" : "Place order"}
        </Button>
      </div>
      <OrderSummary items={items} />
    </form>
  );
}
