"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LayoutDashboard, Menu, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "./logo";
import { SafeLink } from "./safe-link";
import { Container } from "./container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const shopCategories = [{ href: "/shop/modafinil", label: "Modafinil", slug: "modafinil" }];

export function SiteHeader({
  cartCount = 0,
  user,
}: {
  cartCount?: number;
  user?: { name?: string | null; email?: string | null; role?: string | null } | null;
}) {
  const { data: session, status } = useSession();
  const hydratedUser = user ?? session?.user ?? null;
  const [resolvedCartCount, setResolvedCartCount] = useState(cartCount);
  const isStaff = hydratedUser?.role === "ADMIN" || hydratedUser?.role === "STAFF";
  const [open, setOpen] = useState(false);
  const [shopSubOpen, setShopSubOpen] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setResolvedCartCount(0);
      return;
    }
    let cancelled = false;
    fetch("/api/cart/count", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data: { count?: number }) => {
        if (!cancelled) setResolvedCartCount(Number.isFinite(data.count) ? data.count ?? 0 : 0);
      })
      .catch(() => {
        if (!cancelled) setResolvedCartCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (!open) setShopSubOpen(false);
  }, [open]);

  const accountHref = hydratedUser ? "/account" : "/login";
  const accountLabel = hydratedUser ? "Account" : "Sign in";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/80">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                Shop
                <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[12rem] rounded-lg border border-[var(--border)] bg-[var(--background)] p-1 shadow-lg"
                sideOffset={6}
                align="start"
              >
                {shopCategories.map((item) => (
                  <DropdownMenu.Item key={item.href} asChild>
                    <SafeLink
                      href={item.href}
                      className="block cursor-pointer rounded-md px-3 py-2 text-sm outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
                    >
                      {item.label}
                    </SafeLink>
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />
                <DropdownMenu.Item asChild>
                  <SafeLink
                    href="/shop"
                    className="block cursor-pointer rounded-md px-3 py-2 text-sm outline-none hover:bg-[var(--muted)] focus:bg-[var(--muted)]"
                  >
                    All products
                  </SafeLink>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isStaff ? (
            <SafeLink
              href="/admin"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] sm:inline-flex"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              Admin
            </SafeLink>
          ) : null}
          <SafeLink
            href="/cart"
            className="relative inline-flex rounded-lg p-2 text-[var(--foreground)] hover:bg-[var(--muted)]"
            aria-label="Shopping cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {resolvedCartCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-bold text-white">
                {resolvedCartCount > 99 ? "99+" : resolvedCartCount}
              </span>
            ) : null}
          </SafeLink>
          <SafeLink
            href={accountHref}
            className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] sm:inline-flex"
          >
            <User className="h-4 w-4" aria-hidden />
            {accountLabel}
          </SafeLink>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </Button>
        </div>
      </Container>

      <div
        id="mobile-nav"
        className={cn(
          "border-t border-[var(--border)] bg-[var(--background)] md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <Container className="py-4" aria-label="Mobile">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium"
            onClick={() => setShopSubOpen((v) => !v)}
            aria-expanded={shopSubOpen}
          >
            Shop
            <ChevronDown className={cn("h-4 w-4 transition-transform", shopSubOpen && "rotate-180")} />
          </button>
          {shopSubOpen ? (
            <ul className="ml-3 mt-1 space-y-1 border-l border-[var(--border)] pl-3">
              {shopCategories.map((item) => (
                <li key={item.href}>
                  <SafeLink
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-[var(--muted)]"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </SafeLink>
                </li>
              ))}
              <li>
                <SafeLink
                  href="/shop"
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-[var(--muted)]"
                  onClick={() => setOpen(false)}
                >
                  All products
                </SafeLink>
              </li>
            </ul>
          ) : null}
          <SafeLink
            href={accountHref}
            className="mt-2 block rounded-lg px-3 py-2 text-sm font-medium hover:bg-[var(--muted)]"
            onClick={() => setOpen(false)}
          >
            {accountLabel}
          </SafeLink>
        </Container>
      </div>
    </header>
  );
}
