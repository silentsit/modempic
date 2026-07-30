import Link from "next/link";
import { Instagram } from "lucide-react";
import { Container } from "./container";
import { Logo } from "./logo";

const instagramUrl =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/modempic";

const groups = [
  {
    title: "Shop",
    links: [{ href: "/shop/modafinil", label: "Modafinil" }],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Policies",
    links: [
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
              Bridging the gap between you and the medicine you need. <br />
              Reliable access. Transparent prices. Genuine quality. <br />
              Healthcare witthout the hurdles.
            </p>
            <p className="mt-3 max-w-sm text-[0.625rem] leading-snug text-[var(--muted-foreground)]">
              (Not intended to diagnose, treat, cure, or prevent any disease. If you are pregnant, nursing, or on
              medication, ask a health professional before use.)
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
        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border)] pt-8 text-xs text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Modempic. All rights reserved.</p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-2 sm:justify-end">
            <Link href="/privacy-policy" className="transition-colors hover:text-[var(--foreground)]">
              Privacy Policy
            </Link>
            <span aria-hidden className="text-[var(--border)]">
              |
            </span>
            <Link href="/terms-of-service" className="transition-colors hover:text-[var(--foreground)]">
              Terms & Conditions
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
