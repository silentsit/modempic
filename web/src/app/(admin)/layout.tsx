import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Users,
} from "lucide-react";
import { requireStaff } from "@/lib/auth/admin";
import { Logo } from "@/components/site/logo";
import { signOutAction } from "@/lib/actions/sign-out";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: "orders" | "reviews" | "contacts";
};

const primaryNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badgeKey: "orders" },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: Star, badgeKey: "reviews" },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/contacts", label: "Contacts", icon: MessageSquare, badgeKey: "contacts" },
];

const contentNav: NavItem[] = [
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/seo", label: "SEO", icon: Globe },
];

const systemNav: NavItem[] = [
  { href: "/admin/campaigns", label: "Social Proof", icon: Sparkles },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

import { prisma } from "@/lib/db";
import { OrderStatus, ReviewStatus } from "@prisma/client";

async function getCounts() {
  try {
    const [orders, reviews, contacts] = await Promise.all([
      prisma.order.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
      prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
      prisma.contactSubmission.count({ where: { handled: false } }),
    ]);
    return { orders, reviews, contacts };
  } catch {
    return { orders: 0, reviews: 0, contacts: 0 };
  }
}

function NavGroup({
  title,
  items,
  counts,
}: {
  title: string;
  items: NavItem[];
  counts: { orders: number; reviews: number; contacts: number };
}) {
  return (
    <div>
      <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8c8f94]">{title}</p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const badge = item.badgeKey ? counts[item.badgeKey] : 0;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[#3c434a] transition-colors hover:bg-[#eef3f8] hover:text-[#1d2327]"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#646970] group-hover:text-[#2271b1]" />
                <span className="flex-1 truncate">{item.label}</span>
                {badge > 0 ? (
                  <span className="rounded-full bg-[#d63638] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();
  const counts = await getCounts();

  return (
    <div className="min-h-screen bg-[#f6f7f7] text-[#1d2327] [--background:#ffffff] [--border:#dcdcde] [--card:#ffffff] [--foreground:#1d2327] [--muted-foreground:#50575e] [--muted:#f6f7f7] [--primary:#2271b1] [--primary-foreground:#ffffff]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#dcdcde] bg-white md:flex">
          <div className="flex h-14 items-center justify-between gap-2 border-b border-[#dcdcde] bg-white px-4">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="rounded bg-[#f0f0f1] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#50575e]">
                Admin
              </span>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-md border border-[#dcdcde] bg-white px-2 py-1 text-[11px] font-medium text-[#2271b1] hover:bg-[#f6f7f7]"
              aria-label="View site"
              title="View site"
            >
              <ExternalLink className="h-3 w-3" />
              View site
            </Link>
          </div>
          <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4" aria-label="Admin">
            <NavGroup title="Workspace" items={primaryNav} counts={counts} />
            <NavGroup title="Content" items={contentNav} counts={counts} />
            <NavGroup title="System" items={systemNav} counts={counts} />
          </nav>
          <div className="border-t border-[#dcdcde] p-3">
            <Link
              href="/"
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-[#3c434a] transition-colors hover:bg-[#eef3f8] hover:text-[#1d2327]"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-[#646970]" />
                Visit storefront
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-[#8c8f94]" />
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[#dcdcde] bg-white/95 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-[#1d2327]">
                Welcome back<span className="text-[#50575e]">, {session.user?.name?.split(" ")[0] ?? "there"}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/orders"
                className="hidden items-center gap-1.5 rounded-md border border-[#dcdcde] bg-white px-2.5 py-1.5 text-xs font-medium text-[#2271b1] hover:bg-[#f6f7f7] sm:inline-flex"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Inbox
              </Link>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2271b1] text-[11px] font-semibold uppercase text-white">
                  {(session.user?.name ?? session.user?.email ?? "A")[0]}
                </div>
                <div className="text-xs">
                  <p className="font-medium text-[#1d2327]">{session.user?.name ?? "Admin"}</p>
                  <p className="text-[#50575e]">{session.user?.email}</p>
                </div>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-[#dcdcde] bg-white px-2.5 py-1.5 text-xs font-medium text-[#50575e] hover:bg-[#f6f7f7] hover:text-[#1d2327]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
