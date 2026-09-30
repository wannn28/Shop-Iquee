"use client";

import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { ExpressPay } from "@/components/checkout/ExpressPay";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Input";
import { luhnValid, validateCheckout } from "@/lib/checkout";
import type { CartLine, OrderConfirmation, ShippingAddress } from "@/lib/types";
import { useCart } from "@/store/cart";

const ORDER_PATH = "/checkout/confirmation";
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type CheckoutResponse = {
  order?: OrderConfirmation;
  confirmationToken?: string | null;
  demo?: boolean;
  paid?: boolean;
  clientSecret?: string | null;
  error?: string;
  fields?: Record<string, string>;
};

type CheckoutDetails = {
  email: string;
  shipping: ShippingAddress;
};

export function CheckoutForm() {
  const items = useCart((state) => state.items);
  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        body="Add something from the catalog before checkout."
        action={{ href: "/products", label: "Browse the catalog" }}
      />
    );
  }

  if (!stripePromise) {
    return <DemoCheckout items={items} />;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: {
          theme: "stripe",
          variables: { colorPrimary: "#111111", colorText: "#111111", borderRadius: "8px", fontFamily: "Inter, sans-serif" },
        },
      }}
    >
      <StripeCheckout items={items} />
    </Elements>
  );
}

function DemoCheckout({ items }: { items: CartLine[] }) {
  const [card, setCard] = useState({ name: "", number: "", exp: "", cvc: "" });
  const flow = useCheckoutFlow(items);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const cardErrors: Record<string, string> = {};
    if (card.name.trim().length < 2) cardErrors.cardName = "Enter the name on the card.";
    if (!luhnValid(card.number)) cardErrors.cardNumber = "Enter a valid card number.";
    if (!/^\d{2}\s*\/\s*\d{2}$/.test(card.exp.trim())) cardErrors.cardExp = "Use MM / YY.";
    if (!/^\d{3,4}$/.test(card.cvc.trim())) cardErrors.cardCvc = "Enter the security code.";
    await flow.submit(event, cardErrors, async () => {
      /* Demo responses are not charges. The cart stays until a confirmed order exists. */
    });
  }

  return (
    <CheckoutLayout
      items={items}
      errors={flow.errors}
      pending={flow.pending}
      submitLabel={flow.pending ? "Saving preview…" : "Preview demo order"}
      note="Demo checkout. Card details stay in this browser and are not sent. No charge is made, and the order is not confirmed."
      onSubmit={onSubmit}
      payment={
        <>
          <Field
            label="Name on card"
            name="cardName"
            autoComplete="cc-name"
            value={card.name}
            onChange={(event) => setCard((current) => ({ ...current, name: event.target.value }))}
            error={flow.errors.cardName}
          />
          <Field
            label="Card number"
            name="cardNumber"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            value={card.number}
            onChange={(event) => setCard((current) => ({ ...current, number: event.target.value }))}
            error={flow.errors.cardNumber}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Expiry"
              name="cardExp"
              autoComplete="cc-exp"
              placeholder="MM / YY"
              value={card.exp}
              onChange={(event) => setCard((current) => ({ ...current, exp: event.target.value }))}
              error={flow.errors.cardExp}
            />
            <Field
              label="CVC"
              name="cardCvc"
              inputMode="numeric"
              autoComplete="cc-csc"
              value={card.cvc}
              onChange={(event) => setCard((current) => ({ ...current, cvc: event.target.value }))}
              error={flow.errors.cardCvc}
            />
          </div>
        </>
      }
    />
  );
}

function StripeCheckout({ items }: { items: CartLine[] }) {
  const stripe = useStripe();
  const elements = useElements();
  const flow = useCheckoutFlow(items);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!cardComplete) {
      event.preventDefault();
      flow.setErrors((current) => ({ ...current, card: cardError ?? "Enter the card details." }));
      return;
    }
    await flow.submit(event, {}, async (data, details) => {
      if (data.demo || data.paid || !data.clientSecret) return;
      const card = elements?.getElement(CardElement);
      if (!stripe || !card || !data.order) {
        throw new Error("Payment could not be confirmed. Your cart is unchanged.");
      }
      const shipping = details.shipping;
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: `${shipping.firstName} ${shipping.lastName}`,
            email: details.email,
            address: {
              line1: shipping.line1,
              line2: shipping.line2,
              city: shipping.city,
              state: shipping.region,
              postal_code: shipping.postalCode,
              country: shipping.country,
            },
          },
        },
        return_url: `${window.location.origin}${ORDER_PATH}?order=${data.order.id}`,
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Payment was not completed. Your cart is unchanged.");
      }
      const status = result.paymentIntent?.status;
      if (status !== "succeeded" && status !== "processing") {
        throw new Error("Payment was not completed. Your cart is unchanged.");
      }
    });
  }

  return (
    <CheckoutLayout
      items={items}
      errors={flow.errors}
      pending={flow.pending}
      submitLabel={flow.pending ? "Confirming payment…" : "Pay now"}
      note="The card is sent to Stripe. The cart stays until this server reports the order confirmed."
      onSubmit={onSubmit}
      payment={
        <div>
          <p className="type-small">Card</p>
          <div className="mt-1 rounded-input border border-border bg-bg px-3 py-3">
            <CardElement
              options={{
                hidePostalCode: true,
                style: {
                  base: { fontSize: "16px", color: "#111111", "::placeholder": { color: "#6B6B6B" } },
                  invalid: { color: "#DC2626" },
                },
              }}
              onChange={(event) => {
                setCardComplete(event.complete);
                setCardError(event.error?.message ?? null);
              }}
            />
          </div>
          {flow.errors.card ? <p className="mt-1 type-small text-error">{flow.errors.card}</p> : null}
        </div>
      }
    />
  );
}

function useCheckoutFlow(items: CartLine[]) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const signature = items.map((item) => `${item.lineId}:${item.quantity}`).join("|");
  const signatureRef = useRef(signature);
  const idempotencyKey = useRef(crypto.randomUUID());
  if (signatureRef.current !== signature) {
    signatureRef.current = signature;
    idempotencyKey.current = crypto.randomUUID();
  }

  async function submit(
    event: React.FormEvent<HTMLFormElement>,
    extraErrors: Record<string, string>,
    afterAccept: (data: CheckoutResponse, details: CheckoutDetails) => Promise<void>,
  ) {
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

    const validated = validateCheckout(payload);
    const nextErrors = {
      ...(validated.ok ? {} : validated.fields),
      ...extraErrors,
    };
    setErrors(nextErrors);
    if (!validated.ok || Object.keys(extraErrors).length > 0) return;

    setPending(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as CheckoutResponse;
      if (!response.ok || !data.order) {
        setErrors(data.fields ?? { form: data.error ?? "Checkout could not be completed." });
        setPending(false);
        return;
      }
      if (data.confirmationToken) {
        sessionStorage.setItem(`iquee-confirm:${data.order.id}`, data.confirmationToken);
      }
      await afterAccept(data, { email: payload.email, shipping: payload.shipping });
      router.push(`${ORDER_PATH}?order=${data.order.id}`);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Network error. Try again." });
      setPending(false);
    }
  }

  return { errors, setErrors, pending, submit };
}

function CheckoutLayout({
  items,
  errors,
  pending,
  submitLabel,
  note,
  onSubmit,
  payment,
}: {
  items: CartLine[];
  errors: Record<string, string>;
  pending: boolean;
  submitLabel: string;
  note: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  payment: React.ReactNode;
}) {
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
          <p className="type-small text-fg-muted">{note}</p>
          {payment}
        </section>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {submitLabel}
        </Button>
      </div>
      <OrderSummary items={items} />
    </form>
  );
}
