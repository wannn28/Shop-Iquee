import Link from "next/link";

import { buttonClass } from "@/components/ui/Button";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-card border border-border bg-bg-muted px-6 py-16 text-center">
      <h2 className="type-h2">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-fg-muted">{body}</p>
      {action ? (
        <Link href={action.href} className={buttonClass({ size: "lg", className: "mt-6" })}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
