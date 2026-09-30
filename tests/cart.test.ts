import { beforeEach, describe, expect, it } from "vitest";

import { cartSubtotal, useCart } from "@/store/cart";

const tee = {
  productId: 1001,
  slug: "merino-crew",
  name: "Merino Crew",
  image: "/products/merino-crew-1.png",
  unitPrice: 72,
  currency: "USD",
  attributes: {},
  stockQuantity: 2,
};

describe("cart store", () => {
  beforeEach(() => {
    useCart.setState({ items: [], isOpen: false });
  });

  it("adds, merges, caps stock, updates, and removes", () => {
    useCart.getState().addItem(tee);
    expect(useCart.getState().isOpen).toBe(true);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0]?.quantity).toBe(1);

    useCart.getState().addItem({ ...tee, quantity: 5 });
    expect(useCart.getState().items[0]?.quantity).toBe(2);

    useCart.getState().updateQty(useCart.getState().items[0]!.lineId, 1);
    expect(cartSubtotal(useCart.getState().items)).toBe(72);

    useCart.getState().removeItem(useCart.getState().items[0]!.lineId);
    expect(useCart.getState().items).toHaveLength(0);
  });

  it("keeps variants on separate lines and refuses sold-out items", () => {
    useCart.getState().addItem({
      ...tee,
      productId: 1005,
      variationId: "1005-stone-m",
      attributes: { Color: "Stone", Size: "M" },
      stockQuantity: 8,
    });
    useCart.getState().addItem({
      ...tee,
      productId: 1005,
      variationId: "1005-ink-m",
      attributes: { Color: "Ink", Size: "M" },
      stockQuantity: 8,
    });
    expect(useCart.getState().items).toHaveLength(2);

    useCart.getState().addItem({ ...tee, stockQuantity: 0 });
    expect(useCart.getState().items.some((line) => line.productId === 1001 && line.stockQuantity === 0)).toBe(false);
  });

  it("caps a line at 99 when stock is unknown", () => {
    useCart.getState().addItem({ ...tee, productId: 4242, stockQuantity: null, quantity: 200 });
    expect(useCart.getState().items[0]?.quantity).toBe(99);
  });
});
