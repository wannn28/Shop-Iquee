import { Button } from "@/components/ui/Button";

export function ExpressPay() {
  return (
    <section aria-label="Express checkout" className="rounded-card border border-border p-4">
      <p className="type-small text-fg-muted">Express checkout</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button className="w-full" disabled>
          Apple Pay
        </Button>
        <Button className="w-full" disabled>
          Google Pay
        </Button>
      </div>
      <p className="mt-3 type-small text-fg-muted">Coming when wallets are connected.</p>
    </section>
  );
}
