import Link from "next/link";
import { Instagram } from "lucide-react";
import { Container } from "./container";
import { Logo } from "./logo";
import { shopCategoryNav } from "@/data/site-navigation";
import type { Disclaimer, FooterSection, SocialLink } from "@/types";

const instagramUrl =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/modempic";

/**
 * TODO(cursor): move to /data/site.ts (footerNavigation, socialLinks,
 * footerDisclaimer). Shapes already match types.ts — no refactor needed.
 */
const groups: FooterSection[] = [
  {
    title: "Shop",
    links: shopCategoryNav,
  },
  {
    title: "Help",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/refund-policy", label: "Refunds" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/shop/best-sellers", label: "Best Sellers" },
      { href: "/sitemap", label: "Sitemap" },
    ],
  },
];

const socialLinks: SocialLink[] = [
  { platform: "instagram", href: instagramUrl, ariaLabel: "Instagram" },
];

/** Preserved verbatim — compliance copy must not be edited. */
const disclaimer: Disclaimer = {
  id: "footer-medical",
  text: "(Not intended to diagnose, treat, cure, or prevent any disease. If you are pregnant, nursing, or on medication, ask a health professional before use.)",
  placement: "footer",
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Reliable access. Honest prices. No exceptions.
            </p>

            {/* Compliance disclaimer — verbatim, quiet clinical treatment */}
            <p className="mt-6 max-w-sm rounded-2xl border border-border bg-muted px-4 py-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
              {disclaimer.text}
            </p>

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="inline-flex rounded-full border border-border p-2.5 text-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label={social.ariaLabel}
                >
                  <Instagram className="h-5 w-5" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Modempic. All rights reserved.</p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 sm:justify-end">
            <Link
              href="/privacy-policy"
              className="inline-flex min-h-11 items-center transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <span aria-hidden className="text-border">
              |
            </span>
            <Link
              href="/terms-of-service"
              className="inline-flex min-h-11 items-center transition-colors hover:text-foreground"
            >
              Terms &amp; Conditions
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
