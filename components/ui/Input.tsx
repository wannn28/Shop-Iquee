import { cn } from "@/lib/cn";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Field({ label, error, id, className, ...props }: FieldProps) {
  const inputId = id ?? props.name;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="type-small text-fg">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          "mt-1 h-11 w-full rounded-input border bg-bg px-3 text-base text-fg placeholder:text-fg-muted",
          error ? "border-error" : "border-border",
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1 type-small text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
