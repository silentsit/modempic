import type { Announcement } from "@/types";
import { PreferredSourcesButton } from "./preferred-sources-button";

/**
 * TODO(cursor): move to /data/site.ts or Sanity (singleton "announcement" doc).
 */
const announcement: Announcement = {
  id: "free-shipping",
  message: "100% FREE Shipping on ALL orders!",
  isActive: true,
};

export function FreeShippingBanner() {
  if (!announcement.isActive) return null;

  return (
    <div
      className="border-b border-border bg-primary-subtle text-center text-sm leading-5 text-foreground"
      role="region"
      aria-label="Free shipping promotion"
    >
      <p className="flex flex-nowrap items-center justify-center gap-x-2 overflow-x-auto px-3 py-2.5">
        <strong className="shrink-0 font-semibold text-primary">
          <span className="sm:hidden">100% FREE Shipping!</span>
          <span className="hidden sm:inline">{announcement.message}</span>
        </strong>
        <PreferredSourcesButton />
      </p>
    </div>
  );
}
