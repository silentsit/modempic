"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LayoutDashboard, Menu, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "./logo";
import { SafeLink } from "./safe-link";
import { Container } from "./container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const shopCategories = [
  { href: "/shop/modafinil", label: "Modafinil" },
  { href: "/shop/peptides", label: "Peptides" },
  { href: "/shop/skin-care", label: "Skincare" },
  { href: "/shop/antiparasitic", label: "Antiparasitic" },
] as const;

export function SiteHeader({
  cartCount = 0,
  user,
}: {
  cartCount?: number;
  user?: { name?: string | null; email?: string | null; role?: string | null } | null;
}) {
  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";
  const [open, setOpen] = useState(false);
  const [shopSubOpen, setShopSubOpen] = useState(false);

  return (
    <header
      className="border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md"
      suppressHydrationWarning
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 md:hidden"
            suppressHydrationWarning
            onClick={() =>
              setOpen((o) => {
                const next = !o;
                if (!next) setShopSubOpen(false);
                return next;
              })
            }
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-0.5 rounded-md px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] data-[state=open]:bg-[var(--muted)] data-[state=open]:text-[var(--foreground)]"
                  aria-haspopup="menu"
                >
                  Shop
                  <ChevronDown className="h-4 w-4 opacity-80" aria-hidden />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="start"
                  sideOffset={6}
                  className="z-[100] min-w-[12rem] rounded-lg border border-[var(--border)] bg-[var(--background)] p-1 shadow-lg"
                >
                  {shopCategories.map((item) => (
                    <DropdownMenu.Item key={item.href} asChild>
                      <SafeLink
                        href={item.href}
                        className="block cursor-pointer rounded-md px-3 py-2 text-sm text-[var(--foreground)] outline-none data-[highlighted]:bg-[var(--muted)]"
                      >
                        {item.label}
                      </SafeLink>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </nav>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {isStaff ? (
            <SafeLink
              href="/admin"
              className="hidden items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--muted)] sm:inline-flex"
              aria-label="Open admin dashboard"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Admin
            </SafeLink>
          ) : null}
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
        <nav className="flex flex-col px-4 py-3" aria-label="Mobile" suppressHydrationWarning>
          <div className="flex flex-col">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-medium text-[var(--foreground)]"
              aria-expanded={shopSubOpen}
              onClick={() => setShopSubOpen((s) => !s)}
            >
              Shop
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 opacity-70 transition-transform", shopSubOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            <ul
              className={cn(
                "ml-2 mt-1 flex flex-col gap-0.5 border-l-2 border-[var(--border)] pl-3",
                !shopSubOpen && "hidden",
              )}
            >
              {shopCategories.map((item) => (
                <li key={item.href} suppressHydrationWarning>
                  <SafeLink
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm text-[var(--muted-foreground)]"
                    onClick={() => {
                      setOpen(false);
                      setShopSubOpen(false);
                    }}
                  >
                    {item.label}
                  </SafeLink>
                </li>
              ))}
            </ul>
          </div>
          {isStaff ? (
            <SafeLink
              href="/admin"
              className="mt-2 inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-[var(--primary)]"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4" />
              Admin dashboard
            </SafeLink>
          ) : (
            <SafeLink
              href="/login"
              className="mt-2 rounded-md px-3 py-2.5 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              Sign in
            </SafeLink>
          )}
        </nav>
      </div>
    </header>
  );
}
