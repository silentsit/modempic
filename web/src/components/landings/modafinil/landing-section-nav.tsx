"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/site/container";
import { cn } from "@/lib/utils";

export const LANDING_NAV_ITEMS = [
  { href: "#how-to-order", label: "How to order" },
  { href: "#packs", label: "Packs & prices" },
  { href: "#overview", label: "What it is" },
  { href: "#faq", label: "FAQ" },
] as const;

export function LandingSectionNav({ shopHref, shopLabel }: { shopHref: string; shopLabel: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>(LANDING_NAV_ITEMS[0].href);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const ids = LANDING_NAV_ITEMS.map((item) => item.href.slice(1));
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node != null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id;
        if (top) setActive(`#${top}`);
      },
      { rootMargin: "-28% 0px -60% 0px", threshold: [0.15, 0.4, 0.7] },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-[var(--site-sticky-offset)] z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container className="flex h-14 items-center justify-between gap-3">
        <p className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">
          On this page
        </p>

        <nav className="hidden items-center gap-1 md:flex" aria-label="On this page">
          {LANDING_NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                active === item.href
                  ? "bg-primary-subtle text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="md:hidden"
          aria-expanded={open}
          aria-controls="landing-mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
          Jump to
        </Button>

        <Button size="sm" className="hidden sm:inline-flex" asChild>
          <Link href={shopHref}>{shopLabel}</Link>
        </Button>
      </Container>

      <div id="landing-mobile-nav" hidden={!open} className="border-t border-border bg-background md:hidden">
        <Container className="py-3">
          <nav aria-label="On this page" className="grid gap-1">
            {LANDING_NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3 py-3 text-sm font-medium",
                  active === item.href ? "bg-primary-subtle text-primary" : "text-foreground hover:bg-muted",
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Button className="mt-2 w-full" asChild>
              <Link href={shopHref} onClick={() => setOpen(false)}>
                {shopLabel}
              </Link>
            </Button>
          </nav>
        </Container>
      </div>
    </div>
  );
}
