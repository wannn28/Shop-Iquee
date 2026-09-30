export function cartLineId(item: {
  productId: number;
  variationId?: string;
  attributes: Record<string, string>;
}) {
  const attributes = Object.entries(item.attributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
  return `${item.productId}:${item.variationId ?? "simple"}:${attributes}`;
}
