import { cn } from "@/lib/utils";
import type { StorefrontCornerBadge } from "@/lib/product-variants";

const baseClassName =
  "absolute right-2 top-2 z-10 flex h-14 w-14 items-center justify-center rounded-full text-center text-[10px] font-bold uppercase leading-tight text-white shadow-md ring-2 ring-white/30";

export function ProductCornerBadge({ variant }: { variant: StorefrontCornerBadge }) {
  if (variant === "best-seller") {
    return (
      <span className={cn(baseClassName, "bg-amber-500")} aria-label="Best seller">
        Best
        <br />
        Seller
      </span>
    );
  }

  return (
    <span className={cn(baseClassName, "bg-red-600 text-xs")} aria-label="On sale">
      SALE
    </span>
  );
}
