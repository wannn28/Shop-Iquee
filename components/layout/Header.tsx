"use client";

import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { cartCount, useCart } from "@/store/cart";

export function Header() {
  const count = useCart((state) => cartCount(state.items));
  const open = useCart((state) => state.open);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
      <Container className="flex h-16 items-center gap-4 md:h-[72px]">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          iquee
        </Link>
        <Link href="/products" className="inline-flex h-11 items-center type-small md:hidden">
          Shop
        </Link>
        <nav className="ml-2 hidden items-center gap-5 md:flex" aria-label="Primary">
          <Link href="/products" className="type-small">
            Shop
          </Link>
          <Link href="/search" className="type-small">
            Search
          </Link>
        </nav>
        <form action="/search" className="ml-auto hidden md:block">
          <label htmlFor="header-search" className="sr-only">
            Search
          </label>
          <input
            id="header-search"
            name="q"
            placeholder="Search"
            className="h-9 w-48 rounded-input border border-border bg-bg px-3 text-sm"
          />
        </form>
        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Link href="/search" className="inline-flex h-11 w-11 items-center justify-center md:hidden" aria-label="Search">
            <SearchIcon />
          </Link>
          <Link href="/account/login" className="inline-flex h-11 items-center px-2 type-small">
            Account
          </Link>
          <button
            type="button"
            onClick={open}
            className="relative inline-flex h-11 w-11 items-center justify-center"
            aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <BagIcon />
            {count > 0 ? (
              <span className="absolute right-0 top-1 flex h-5 min-w-5 items-center justify-center rounded-pill bg-primary px-1 text-[11px] text-primary-fg">
                {count}
              </span>
            ) : null}
          </button>
        </div>
      </Container>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6.5 8h11l-.8 11.2a1 1 0 0 1-1 .8H8.3a1 1 0 0 1-1-.8L6.5 8Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
