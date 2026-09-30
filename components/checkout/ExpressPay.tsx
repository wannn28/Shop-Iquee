"use client";

const configured = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export function ExpressPay() {
  return (
    <section aria-label="Express checkout" className="rounded-card border border-border p-4">
      <p className="type-small text-fg-muted">Express checkout</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className="h-11 rounded-button bg-fg text-sm font-medium text-primary-fg" disabled={!configured}>
          Apple Pay
        </button>
        <button type="button" className="h-11 rounded-button bg-fg text-sm font-medium text-primary-fg" disabled={!configured}>
          Google Pay
        </button>
      </div>
      <p className="mt-3 type-small text-fg-muted">
        {configured
          ? "Wallet buttons use the Stripe publishable key for this storefront."
          : "Wallet buttons activate when Stripe keys are set. Card checkout below still works in demo mode."}
      </p>
    </section>
  );
}
