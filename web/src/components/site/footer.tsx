import Link from "next/link";
import { Instagram } from "lucide-react";
import { Container } from "./container";
import { Logo } from "./logo";

const instagramUrl =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/modempic";

const groups = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All products" },
      { href: "/shop/best-sellers", label: "Best sellers" },
      { href: "/shop/vitamins", label: "Vitamins" },
      { href: "/shop/herbs", label: "Herbs" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/shipping", label: "Shipping" },
      { href: "/refund-policy", label: "Refunds" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--muted)]/40">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-[var(--muted-foreground)]">
              Accessible, affordable support for your daily wellness. Dietary supplements for structure and function
              support—crafted with care, priced fairly.
            </p>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer me"
              className="mt-4 inline-flex text-[var(--foreground)] transition-opacity hover:opacity-80"
              aria-label="Instagram"
            >
              <Instagram className="h-6 w-6" strokeWidth={1.75} />
            </a>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">{g.title}</h3>
              <ul className="mt-3 space-y-2">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-[var(--border)] pt-8 text-xs text-[var(--muted-foreground)]">
          <p>© {new Date().getFullYear()} Modempic. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
