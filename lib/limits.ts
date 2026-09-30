/** Per-line ceiling when stock is unknown or higher than this. */
export const MAX_LINE_QTY = 99;

/** Reject checkout totals above this so a bad quantity cannot mint a huge charge. */
export const MAX_ORDER_TOTAL = 20_000;

/** Null stock is not unlimited. Zero stock cannot be purchased. */
export function availableQuantity(stockQuantity: number | null) {
  if (stockQuantity == null) return MAX_LINE_QTY;
  if (stockQuantity <= 0) return 0;
  return Math.min(stockQuantity, MAX_LINE_QTY);
}
