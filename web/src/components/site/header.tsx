"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronDown, LayoutDashboard, Menu, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "./logo";
import { SafeLink } from "./safe-link";
import { Container } from "./container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { primaryNav, shopCategoryNav } from "@/data/site-navigation";
import type { SiteUser } from "@/types";

export function SiteHeader({
  cartCount = 0,
  user,
}: {
  cartCount?: number;
  user?: SiteUser | null;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const hydratedUser = user ?? session?.user ?? null;
  const [resolvedCartCount, setResolvedCartCount] = useState(cartCount);
  const isStaff = hydratedUser?.role === "ADMIN" || hydratedUser?.role === "STAFF";
  const [open, setOpen] = useState(false);
  const [shopSubOpen, setShopSubOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;
    fetch("/api/cart/count", { cache: "no-store", credentials: "same-origin" })
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
  }, [status, pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) setShopSubOpen(false);
  }, [open]);

  const accountHref = hydratedUser ? "/account" : "/login";
  const accountLabel = hydratedUser ? "Account" : "Sign in";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          <div className="group relative">
            <SafeLink
              href="/shop"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted lg:px-4"
            >
              Shop
              <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
            </SafeLink>
            <div className="absolute left-0 top-full z-50 min-w-[13rem] pt-2 opacity-0 pointer-events-none transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
              <div className="rounded-2xl border border-border bg-background p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
                {shopCategoryNav.map((item) => (
                  <SafeLink
                    key={item.href}
                    href={item.href}
                    className="block rounded-full px-4 py-2.5 text-sm text-foreground outline-none transition-colors hover:bg-muted focus:bg-muted"
                  >
                    {item.label}
                  </SafeLink>
                ))}
              </div>
            </div>
          </div>

          {primaryNav.map((item) => (
            <SafeLink
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted lg:px-4"
            >
              {item.label}
            </SafeLink>
          ))}
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
            className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2.5 text-foreground transition-colors hover:bg-muted"
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
            className="min-h-11 min-w-11 rounded-full lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
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
          "border-t border-border bg-background lg:hidden",
          open ? "fixed inset-x-0 bottom-0 top-[var(--site-sticky-offset)] z-40 overflow-y-auto overscroll-contain" : "hidden",
        )}
      >
        <Container className="py-5" aria-label="Mobile">
          <div className="flex items-center gap-1">
            <SafeLink
              href="/shop"
              className="flex min-h-11 flex-1 items-center rounded-full px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Shop
            </SafeLink>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
              onClick={() => setShopSubOpen((v) => !v)}
              aria-expanded={shopSubOpen}
              aria-label="Shop categories"
            >
              <ChevronDown
                className={cn("h-4 w-4 opacity-60 transition-transform", shopSubOpen && "rotate-180")}
              />
            </button>
          </div>
          {shopSubOpen ? (
            <ul className="ml-4 mt-1.5 space-y-1 border-l border-border pl-3">
              {shopCategoryNav.map((item) => (
                <li key={item.href}>
                  <SafeLink
                    href={item.href}
                    className="flex min-h-11 items-center rounded-full px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </SafeLink>
                </li>
              ))}
            </ul>
          ) : null}
          {primaryNav.map((item) => (
            <SafeLink
              key={item.href}
              href={item.href}
              className="mt-1 flex min-h-11 items-center rounded-full px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </SafeLink>
          ))}
          <SafeLink
            href={accountHref}
            className="mt-2 flex min-h-11 items-center justify-center rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            onClick={() => setOpen(false)}
          >
            {accountLabel}
          </SafeLink>
        </Container>
      </div>
    </header>
  );
}
