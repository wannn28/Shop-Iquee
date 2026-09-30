import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { siteHost } from "@/lib/site";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "Catalog" },
      { href: "/search", label: "Search" },
      { href: "/products?category=apparel", label: "Apparel" },
      { href: "/products?category=home", label: "Home" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/account/orders", label: "Orders" },
      { href: "/account/login", label: "Sign in" },
      { href: "/checkout", label: "Checkout" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <Container className="grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-lg font-semibold tracking-tight">iquee</p>
          <p className="mt-2 max-w-sm type-small text-fg-muted">
            Everyday objects, considered. Guest checkout on {siteHost()}.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="type-card">{column.title}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="type-small text-fg-muted">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <Container className="border-t border-border py-4">
        <p className="type-small text-fg-muted">© {new Date().getFullYear()} iquee</p>
      </Container>
    </footer>
  );
}
