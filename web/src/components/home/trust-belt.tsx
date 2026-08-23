import { Container } from "@/components/site/container";
import { formatUsd } from "@/lib/domain/money";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/domain/checkout-pricing";
import { cn } from "@/lib/utils";
import { Mail, Plane, ShieldCheck, Truck } from "lucide-react";

/**
 * Compact colored belt directly under the hero — same pattern as the
 * icon-strip trust bar competitors run right below their fold. Copy stays
 * to claims we can actually back (email support, not 24/7 phone/chat).
 */
const items = [
  { icon: Truck, label: "Free Shipping", sub: `Orders over ${formatUsd(FREE_SHIPPING_THRESHOLD_CENTS)}` },
  { icon: Mail, label: "Fast Support", sub: "We reply by email" },
  { icon: Plane, label: "Guaranteed Delivery", sub: "Right to your doorstep" },
  { icon: ShieldCheck, label: "100% Secure", sub: "Payment via Credit/Debit or Crypto" },
] as const;

export function TrustBeltSection() {
  return (
    <section className="relative z-10 bg-primary py-4" aria-label="Shopping guarantees">
      <Container>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:flex sm:flex-nowrap sm:items-center sm:justify-between sm:gap-2">
          {items.map(({ icon: Icon, label, sub }, index) => (
            <li
              key={label}
              className={cn(
                "flex min-w-0 items-center gap-3 sm:flex-1 sm:justify-center",
                index > 0 && "sm:border-l sm:border-white/20 sm:pl-6",
              )}
            >
              <span
                className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[10px] border border-white/20 bg-gradient-to-br from-white/25 to-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.25)]"
                aria-hidden
              >
                <Icon className="h-6 w-6 text-white" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold leading-tight text-white">{label}</p>
                <p className="text-[13px] leading-snug text-white/90">{sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
