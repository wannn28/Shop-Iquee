"use client";

import { useEffect } from "react";

import { useCart } from "@/store/cart";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);
  return children;
}
