/** Cart clears only after GET /api/orders/:id returns confirmed. */
export function shouldClearCart(status: string | null | undefined) {
  return status === "confirmed";
}
