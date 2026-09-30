import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { availableQuantity } from "@/lib/limits";
import { cartLineId } from "@/store/line";
import type { CartLine } from "@/lib/types";

type AddInput = Omit<CartLine, "lineId" | "quantity"> & { quantity?: number };

type CartState = {
  items: CartLine[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (item: AddInput) => void;
  updateQty: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
};

const memory: Record<string, string> = {};

const memoryStorage = {
  getItem: (name: string) => memory[name] ?? null,
  setItem: (name: string, value: string) => {
    memory[name] = value;
  },
  removeItem: (name: string) => {
    delete memory[name];
  },
};

function cap(quantity: number, stockQuantity: number | null) {
  const ceiling = availableQuantity(stockQuantity);
  if (ceiling < 1) return 0;
  return Math.min(Math.max(1, quantity), ceiling);
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      addItem: (item) => {
        const quantity = cap(item.quantity ?? 1, item.stockQuantity);
        if (quantity < 1) return;
        const lineId = cartLineId(item);
        const existing = get().items.find((line) => line.lineId === lineId);
        if (existing) {
          set({
            isOpen: true,
            items: get().items.map((line) =>
              line.lineId === lineId
                ? { ...line, quantity: cap(line.quantity + (item.quantity ?? 1), line.stockQuantity) }
                : line,
            ),
          });
          return;
        }
        set({
          isOpen: true,
          items: [
            ...get().items,
            {
              ...item,
              lineId,
              quantity,
            },
          ],
        });
      },
      updateQty: (lineId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((line) => line.lineId !== lineId) });
          return;
        }
        set({
          items: get().items.map((line) =>
            line.lineId === lineId ? { ...line, quantity: cap(quantity, line.stockQuantity) } : line,
          ),
        });
      },
      removeItem: (lineId) => set({ items: get().items.filter((line) => line.lineId !== lineId) }),
      clear: () => set({ items: [], isOpen: false }),
    }),
    {
      name: "iquee-cart",
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      storage: createJSONStorage(() => (typeof window === "undefined" ? memoryStorage : window.localStorage)),
    },
  ),
);

export function cartSubtotal(items: CartLine[]) {
  return items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}

export function cartCount(items: CartLine[]) {
  return items.reduce((sum, line) => sum + line.quantity, 0);
}
