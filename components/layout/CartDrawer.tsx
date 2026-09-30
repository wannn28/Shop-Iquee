"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Price } from "@/components/product/Price";
import { QtyStepper } from "@/components/product/QtyStepper";
import { ProductImage } from "@/components/product/ProductImage";
import { buttonClass } from "@/components/ui/Button";
import { availableQuantity } from "@/lib/limits";
import { FREE_SHIPPING_THRESHOLD, formatPrice, shippingAmount } from "@/lib/money";
import { cartSubtotal, useCart } from "@/store/cart";

export function CartDrawer() {
  const items = useCart((state) => state.items);
  const isOpen = useCart((state) => state.isOpen);
  const close = useCart((state) => state.close);
  const updateQty = useCart((state) => state.updateQty);
  const removeItem = useCart((state) => state.removeItem);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const node = panelRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, textarea") ?? [],
      );
    focusable()[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const list = focusable();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [isOpen, close]);

  const subtotal = cartSubtotal(items);
  const shipping = shippingAmount(subtotal);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div
      className={isOpen ? "fixed inset-0 z-50" : "pointer-events-none fixed inset-0 z-50"}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <button
        type="button"
        aria-label="Close cart"
        className={`absolute inset-0 bg-fg/30 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={close}
        tabIndex={isOpen ? 0 : -1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-bg shadow-xl transition-transform sm:rounded-l-drawer ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5 md:h-[72px]">
          <h2 id="cart-title" className="type-card">
            Cart
          </h2>
          <button type="button" onClick={close} className="h-11 px-2 type-small" aria-label="Close">
            Close
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="type-h2">Your cart is empty</p>
            <p className="mt-2 type-small text-fg-muted">Add a piece from the catalog to check out as a guest.</p>
            <Link href="/products" onClick={close} className={buttonClass({ size: "lg", className: "mt-6" })}>
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {items.map((item) => (
                <li key={item.lineId} className="flex gap-3">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={close}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-card bg-bg-muted"
                  >
                    <ProductImage src={item.image} alt="" sizes="80px" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/products/${item.slug}`} onClick={close} className="type-card">
                          {item.name}
                        </Link>
                        {Object.keys(item.attributes).length > 0 ? (
                          <p className="type-small text-fg-muted">
                            {Object.entries(item.attributes)
                              .map(([name, value]) => `${name}: ${value}`)
                              .join(" · ")}
                          </p>
                        ) : null}
                      </div>
                      <Price price={item.unitPrice * item.quantity} currency={item.currency} />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <QtyStepper
                        value={item.quantity}
                        max={availableQuantity(item.stockQuantity)}
                        onChange={(quantity) => updateQty(item.lineId, quantity)}
                        label={`Quantity for ${item.name}`}
                      />
                      <button
                        type="button"
                        className="type-small text-fg-muted"
                        onClick={() => removeItem(item.lineId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-5 py-5">
              <p className="type-small text-fg-muted">
                {remaining > 0
                  ? `You are ${formatPrice(remaining)} away from complimentary shipping.`
                  : "Complimentary shipping is included."}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="type-small text-fg-muted">Subtotal</span>
                <span className="type-price">{formatPrice(subtotal)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="type-small text-fg-muted">Shipping</span>
                <span className="type-small">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={close}
                className={buttonClass({ size: "lg", className: "mt-4 w-full" })}
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
