"use client";

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
};

export function QtyStepper({ value, min = 1, max, onChange, label = "Quantity" }: Props) {
  const decreaseDisabled = value <= min;
  const increaseDisabled = max != null && value >= max;
  return (
    <div className="inline-flex h-11 items-center rounded-input border border-border" role="group" aria-label={label}>
      <button
        type="button"
        className="h-11 w-11 text-lg disabled:opacity-40"
        onClick={() => onChange(value - 1)}
        disabled={decreaseDisabled}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="h-11 w-11 text-lg disabled:opacity-40"
        onClick={() => onChange(value + 1)}
        disabled={increaseDisabled}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
