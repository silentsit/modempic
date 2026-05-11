import Link from "next/link";
import { cn } from "@/lib/utils";

export type CheckoutProgressStep = "cart" | "details" | "finish";

export function CheckoutProgress({ current }: { current: CheckoutProgressStep }) {
  const steps: { id: CheckoutProgressStep; label: string; href: string | null }[] = [
    { id: "cart", label: "Cart", href: "/cart" },
    { id: "details", label: "Information", href: "/checkout" },
    { id: "finish", label: "Finish", href: null },
  ];

  const idx = steps.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Checkout progress" className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-3">
      {steps.map((s, i) => {
        const state = i < idx ? "complete" : i === idx ? "current" : "upcoming";
        const inner = (
          <span
            className={cn(
              "text-sm font-medium",
              state === "current" && "font-semibold text-[var(--foreground)]",
              state === "complete" && "text-[var(--muted-foreground)]",
              state === "upcoming" && "text-[var(--muted-foreground)]/65",
            )}
          >
            {s.label}
          </span>
        );

        return (
          <span key={s.id} className="flex items-center gap-1.5 sm:gap-3">
            {i > 0 ? (
              <span className="text-[var(--border)] select-none" aria-hidden>
                —
              </span>
            ) : null}
            {s.href && state !== "current" ? (
              <Link href={s.href} className="rounded-md px-1 py-0.5 hover:bg-[var(--muted)]/70 hover:text-[var(--foreground)]">
                {inner}
              </Link>
            ) : (
              <span className={cn("px-1 py-0.5", state === "current" && "rounded-md bg-[var(--muted)]/50")}>{inner}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
