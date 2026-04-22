import Link from "next/link";
import { Container } from "./container";
import { Logo } from "./logo";

const supportEmail = "support@modempic.com";

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
            <Logo className="text-lg" />
            <p className="mt-3 max-w-sm text-sm text-[var(--muted-foreground)]">
              Accessible, affordable support for your daily wellness. Dietary supplements for structure and function
              support—crafted with care, priced fairly.
            </p>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              * These statements have not been evaluated by the Food and Drug Administration. These products are not
              intended to diagnose, treat, cure, or prevent any disease.
            </p>
            <p className="mt-4 text-sm">
              <a href={`mailto:${supportEmail}`} className="text-[var(--primary)] hover:underline">
                {supportEmail}
              </a>
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Social:{" "}
              <span className="text-[var(--muted-foreground)]/70">
                (add your links when live — we use rel=&quot;me&quot; for verified profiles)
              </span>
            </p>
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
        <div className="mt-10 flex flex-col gap-2 border-t border-[var(--border)] pt-8 text-xs text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Modempic. All rights reserved. USD only.</p>
          <p>
            <Link href="/login" className="hover:underline">
              Sign in
            </Link>
            {" · "}
            <Link href="/register" className="hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
