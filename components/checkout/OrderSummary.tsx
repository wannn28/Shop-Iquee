import { Price } from "@/components/product/Price";
import { formatPrice, shippingAmount } from "@/lib/money";
import type { CartLine } from "@/lib/types";
import { cartSubtotal } from "@/store/cart";

export function OrderSummary({ items }: { items: CartLine[] }) {
  const subtotal = cartSubtotal(items);
  const shipping = shippingAmount(subtotal);
  const total = subtotal + shipping;

  return (
    <aside className="h-fit rounded-card border border-border bg-bg-muted p-5 lg:sticky lg:top-24">
      <h2 className="type-card">Summary</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.lineId} className="flex items-start justify-between gap-3">
            <div>
              <p className="type-small">
                {item.name} × {item.quantity}
              </p>
              {Object.keys(item.attributes).length > 0 ? (
                <p className="type-small text-fg-muted">
                  {Object.values(item.attributes).join(" / ")}
                </p>
              ) : null}
            </div>
            <Price price={item.unitPrice * item.quantity} currency={item.currency} />
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 border-t border-border pt-4">
        <div className="flex justify-between type-small">
          <dt className="text-fg-muted">Subtotal</dt>
          <dd>{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between type-small">
          <dt className="text-fg-muted">Shipping</dt>
          <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
        </div>
        <div className="flex justify-between type-price">
          <dt>Total</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
      </dl>
    </aside>
  );
}
