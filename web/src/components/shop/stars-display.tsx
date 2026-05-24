import { cn } from "@/lib/utils";

export function StarsDisplay({
  rating,
  max = 5,
  size = "md",
  className,
}: {
  /** Whole or fractional rating for display (e.g. 4.8). Rounds to nearest star for fill. */
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const filled = Math.min(max, Math.max(0, Math.round(rating)));
  const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div
      className={cn("flex items-center gap-0.5 leading-none", sizeClass, className)}
      aria-hidden
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
        <span key={i} className={i <= filled ? "text-amber-400" : "text-neutral-300 dark:text-neutral-600"}>
          ★
        </span>
      ))}
    </div>
  );
}
