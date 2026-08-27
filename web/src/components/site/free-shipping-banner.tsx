import Link from "next/link";
import type { Announcement } from "@/types";

/**
 * TODO(cursor): move to /data/site.ts or Sanity (singleton "announcement" doc).
 */
const announcement: Announcement = {
  id: "free-shipping",
  message: "100% FREE Shipping",
  cta: { label: "Shop now", href: "/shop" },
  isActive: true,
};

export function FreeShippingBanner() {
  if (!announcement.isActive) return null;

  return (
    <div
      className="border-b border-border bg-primary-subtle text-center text-sm text-foreground"
      role="region"
      aria-label="Free shipping promotion"
    >
      <p className="px-4 py-2.5">
        <strong className="font-semibold text-primary">{announcement.message}</strong>.{" "}
        <Link
          href={announcement.cta!.href}
          className="font-medium text-accent underline underline-offset-2 transition-colors hover:text-accent-hover"
        >
          {announcement.cta!.label}
        </Link>
      </p>
    </div>
  );
}
