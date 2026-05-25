import Link from "next/link";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/domain/checkout-pricing";
import { formatUsd } from "@/lib/domain/money";

export function FreeShippingBanner() {
  return (
    <div
      className="border-b border-emerald-950/20 bg-[#0f5739] text-center text-sm text-white"
      role="region"
      aria-label="Free shipping promotion"
    >
      <p className="px-4 py-2.5">
        <strong className="font-semibold">Free shipping</strong> on orders over {formatUsd(FREE_SHIPPING_THRESHOLD_CENTS)}.{" "}
        <Link href="/shop" className="font-medium text-emerald-100 underline underline-offset-2 hover:text-white">
          Shop now
        </Link>
      </p>
    </div>
  );
}
