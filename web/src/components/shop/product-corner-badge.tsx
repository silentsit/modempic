import { cn } from "@/lib/utils";
import type { StorefrontCornerBadge } from "@/lib/product-variants";

const baseClassName =
  "absolute right-3 top-3 z-10 inline-flex items-center rounded-full border px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em]";

export function ProductCornerBadge({ variant }: { variant: StorefrontCornerBadge }) {
  if (variant === "best-seller") {
    return (
      <span
        className={cn(baseClassName, "border-primary/25 bg-primary-subtle text-primary")}
        aria-label="Best seller"
      >
        Best Seller
      </span>
    );
  }

  return (
    <span
      className={cn(baseClassName, "border-[#DC2626]/25 bg-[#DC2626]/10 text-[#DC2626]")}
      aria-label="On sale"
    >
      Sale
    </span>
  );
}
