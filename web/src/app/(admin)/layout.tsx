import Link from "next/link";
import { requireStaff } from "@/lib/auth/admin";
import { Container } from "@/components/site/container";
import { Logo } from "@/components/site/logo";
import { signOutAction } from "@/lib/actions/sign-out";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/emails", label: "Emails" },
];

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  await requireStaff();
  return (
    <div className="min-h-screen bg-white text-[#1a1f1c] [--background:#ffffff] [--border:#d9e0d9] [--card:#ffffff] [--foreground:#1a1f1c] [--muted-foreground:#5c6560] [--muted:#f4f6f4] [--primary:#2d6a4f] [--primary-foreground:#ffffff]">
      <header className="border-b border-[var(--border)] bg-white">
        <Container className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo />
            <Link href="/admin" className="text-xs font-medium text-[var(--muted-foreground)] hover:underline">
              Admin
            </Link>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="text-sm text-[var(--muted-foreground)] hover:underline">
              Sign out
            </button>
          </form>
        </Container>
      </header>
      <Container className="flex gap-8 py-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="space-y-1" aria-label="Admin">
            {nav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block rounded-md px-2 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                {l.label}
              </Link>
            ))}
            <Link href="/" className="mt-4 block text-sm text-[var(--primary)] hover:underline">
              ← Storefront
            </Link>
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </Container>
    </div>
  );
}
