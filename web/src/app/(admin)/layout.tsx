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
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)]">
        <Container className="flex h-14 items-center justify-between gap-4">
          <Link href="/admin" className="text-sm font-medium">
            <Logo /> <span className="text-xs text-[var(--muted-foreground)]">Admin</span>
          </Link>
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
