import Link from "next/link";
import { cn } from "@/lib/utils";

export type CheckoutProgressStep = "cart" | "details" | "finish";

export function CheckoutProgress({ current }: { current: CheckoutProgressStep }) {
  const steps: { id: CheckoutProgressStep; label: string; href: string | null }[] = [
    { id: "cart", label: "Cart", href: "/cart" },
    { id: "details", label: "Details & payment", href: "/checkout" },
    { id: "finish", label: "Confirmation", href: null },
  ];

  const idx = steps.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Checkout progress" className="w-full max-w-md">
      <ol className="flex items-center">
        {steps.map((s, i) => {
          const state = i < idx ? "complete" : i === idx ? "current" : "upcoming";

          return (
            <li key={s.id} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                    state === "complete" && "bg-[var(--primary)] text-[var(--primary-foreground)]",
                    state === "current" && "bg-[var(--foreground)] text-[var(--background)] ring-2 ring-[var(--primary)]/30",
                    state === "upcoming" && "border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]",
                  )}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  {i + 1}
                </span>
                {s.href && state === "complete" ? (
                  <Link
                    href={s.href}
                    className="max-w-[5.5rem] text-center text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:max-w-none"
                  >
                    {s.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "max-w-[5.5rem] text-center text-xs font-medium sm:max-w-none",
                      state === "current" ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]",
                    )}
                  >
                    {s.label}
                  </span>
                )}
              </div>
              {i < steps.length - 1 ? (
                <span
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full",
                    i < idx ? "bg-[var(--primary)]" : "bg-[var(--border)]",
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
