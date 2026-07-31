import Link from "next/link";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/domain/checkout-pricing";
import { formatUsd } from "@/lib/domain/money";
import type { Announcement } from "@/types";

/**
 * TODO(cursor): move to /data/site.ts or Sanity (singleton "announcement" doc).
 * Message is assembled here because the threshold is a pricing constant.
 */
const announcement: Omit<Announcement, "message"> & { thresholdCents: number } = {
  id: "free-shipping",
  cta: { label: "Shop now", href: "/shop" },
  isActive: true,
  thresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
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
        <strong className="font-semibold text-primary">Free shipping</strong> on orders over{" "}
        {formatUsd(announcement.thresholdCents)}.{" "}
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
