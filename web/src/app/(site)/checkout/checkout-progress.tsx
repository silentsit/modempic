import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckoutProgressStep = "cart" | "details" | "finish";

export function CheckoutProgress({ current }: { current: CheckoutProgressStep }) {
  const steps: {
    id: CheckoutProgressStep;
    label: string;
    shortLabel: string;
    href: string | null;
  }[] = [
    { id: "cart", label: "Cart", shortLabel: "Cart", href: "/cart" },
    { id: "details", label: "Details & payment", shortLabel: "Details", href: "/checkout" },
    { id: "finish", label: "Confirmation", shortLabel: "Done", href: null },
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
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium tabular-nums transition-colors",
                    state === "complete" && "bg-primary text-primary-foreground",
                    state === "current" && "bg-accent text-accent-foreground",
                    state === "upcoming" && "border border-border bg-background text-muted-foreground",
                  )}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  {state === "complete" ? <Check className="h-4 w-4" strokeWidth={2.25} aria-hidden /> : i + 1}
                </span>
                {s.href && state === "complete" ? (
                  <Link
                    href={s.href}
                    className="text-center text-xs font-medium text-muted-foreground transition-colors hover:text-accent"
                  >
                    <span className="sm:hidden">{s.shortLabel}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "text-center text-xs font-medium",
                      state === "current" ? "font-semibold text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span className="sm:hidden">{s.shortLabel}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </span>
                )}
              </div>
              {i < steps.length - 1 ? (
                <span
                  className={cn("mx-2 h-px flex-1", i < idx ? "bg-primary" : "bg-border")}
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
