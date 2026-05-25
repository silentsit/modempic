"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/social-proof", label: "Notifications", exact: true },
  { href: "/admin/social-proof/events", label: "Events feed", exact: false },
] as const;

export function SocialProofSubNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex flex-wrap gap-1 border-b border-[#dcdcde]" aria-label="Social proof sections">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-[#2271b1] text-[#2271b1]"
                : "border-transparent text-[#50575e] hover:border-[#c3c4c7] hover:text-[#1d2327]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
