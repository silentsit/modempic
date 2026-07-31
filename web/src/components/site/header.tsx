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
import type { NavItem, SiteUser } from "@/types";

/**
 * TODO(cursor): replace with /data/site.ts -> siteNavigation.
 * Shape already matches NavItem[]; "All products" is appended at render.
 */
const shopCategories: (NavItem & { slug: string })[] = [
  { href: "/shop/modafinil", label: "Modafinil", slug: "modafinil" },
];

export function SiteHeader({
  cartCount = 0,
  user,
}: {
  cartCount?: number;
  user?: SiteUser | null;
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Shop
                <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[13rem] rounded-2xl border border-border bg-background p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
                sideOffset={8}
                align="start"
              >
                {shopCategories.map((item) => (
                  <DropdownMenu.Item key={item.href} asChild>
                    <SafeLink
                      href={item.href}
                      className="block cursor-pointer rounded-full px-4 py-2.5 text-sm text-foreground outline-none transition-colors hover:bg-muted focus:bg-muted data-[highlighted]:bg-muted"
                    >
                      {item.label}
                    </SafeLink>
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator className="mx-3 my-1.5 h-px bg-border" />
                <DropdownMenu.Item asChild>
                  <SafeLink
                    href="/shop"
                    className="block cursor-pointer rounded-full px-4 py-2.5 text-sm font-medium text-accent outline-none transition-colors hover:bg-accent-subtle focus:bg-accent-subtle data-[highlighted]:bg-accent-subtle"
                  >
                    All products
                  </SafeLink>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isStaff ? (
            <SafeLink
              href="/admin"
              className="hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              Admin
            </SafeLink>
          ) : null}

          <SafeLink
            href="/cart"
            className="relative inline-flex rounded-full p-2.5 text-foreground transition-colors hover:bg-muted"
            aria-label="Shopping cart"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
            {resolvedCartCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {resolvedCartCount > 99 ? "99+" : resolvedCartCount}
              </span>
            ) : null}
          </SafeLink>

          <SafeLink
            href={accountHref}
            className="hidden items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary sm:inline-flex"
          >
            <User className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            {accountLabel}
          </SafeLink>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
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
          "border-t border-border bg-background md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <Container className="py-5" aria-label="Mobile">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-full px-4 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
            onClick={() => setShopSubOpen((v) => !v)}
            aria-expanded={shopSubOpen}
          >
            Shop
            <ChevronDown
              className={cn("h-4 w-4 opacity-60 transition-transform", shopSubOpen && "rotate-180")}
            />
          </button>
          {shopSubOpen ? (
            <ul className="ml-4 mt-1.5 space-y-1 border-l border-border pl-3">
              {shopCategories.map((item) => (
                <li key={item.href}>
                  <SafeLink
                    href={item.href}
                    className="block rounded-full px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </SafeLink>
                </li>
              ))}
              <li>
                <SafeLink
                  href="/shop"
                  className="block rounded-full px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent-subtle"
                  onClick={() => setOpen(false)}
                >
                  All products
                </SafeLink>
              </li>
            </ul>
          ) : null}
          <SafeLink
            href={accountHref}
            className="mt-2 block rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            onClick={() => setOpen(false)}
          >
            {accountLabel}
          </SafeLink>
        </Container>
      </div>
    </header>
  );
}
