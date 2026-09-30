import { formatPrice } from "@/lib/money";

export function Price({
  price,
  regularPrice,
  onSale,
  currency = "USD",
  className,
}: {
  price: string | number;
  regularPrice?: string | number;
  onSale?: boolean;
  currency?: string;
  className?: string;
}) {
  return (
    <p className={className ? `flex items-baseline gap-2 ${className}` : "flex items-baseline gap-2"}>
      <span className="type-price">{formatPrice(price, currency)}</span>
      {onSale && regularPrice != null ? (
        <span className="type-small text-fg-muted line-through">{formatPrice(regularPrice, currency)}</span>
      ) : null}
    </p>
  );
}
