"use client";

import { useState } from "react";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "./logo";
import { SafeLink } from "./safe-link";
import { Container } from "./container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  cartCount = 0,
  user,
}: {
  cartCount?: number;
  user?: { name?: string | null; email?: string | null } | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {nav.map((item) => (
              <SafeLink
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                {item.label}
              </SafeLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="relative" asChild>
            <SafeLink href="/cart" aria-label={`Shopping cart${cartCount ? `, ${cartCount} items` : ""}`}>
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-bold text-[var(--primary-foreground)]">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              ) : null}
            </SafeLink>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <SafeLink href={user ? "/account" : "/login"} aria-label={user ? "My account" : "Sign in"}>
              <User className="h-5 w-5" />
            </SafeLink>
          </Button>
        </div>
      </Container>
      <div
        className={cn(
          "border-t border-[var(--border)] bg-[var(--background)] md:hidden",
          open ? "block" : "hidden",
        )}
        id="mobile-nav"
      >
        <nav className="flex flex-col px-4 py-3" aria-label="Mobile">
          {nav.map((item) => (
            <SafeLink
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2.5 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </SafeLink>
          ))}
          <SafeLink
            href="/login"
            className="mt-2 rounded-md px-3 py-2.5 text-sm font-medium"
            onClick={() => setOpen(false)}
          >
            Sign in
          </SafeLink>
        </nav>
      </div>
    </header>
  );
}
