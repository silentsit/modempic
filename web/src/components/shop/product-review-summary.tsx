import { SafeLink } from "@/components/site/safe-link";

export function ProductReviewSummary({
  reviewCount,
  averageRating,
}: {
  reviewCount: number;
  averageRating: number;
}) {
  const filled = reviewCount > 0 ? Math.min(5, Math.max(0, Math.round(averageRating))) : 0;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <div
        className="flex items-center gap-0.5 text-lg leading-none"
        aria-label={reviewCount > 0 ? `${averageRating.toFixed(1)} out of 5 stars` : "No rating yet"}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= filled ? "text-amber-400" : "text-neutral-300 dark:text-neutral-600"}>
            ★
          </span>
        ))}
      </div>
      {reviewCount > 0 ? (
        <SafeLink href="#reviews" className="text-sm text-blue-600 underline-offset-2 hover:underline dark:text-blue-400">
          ({reviewCount} customer review{reviewCount === 1 ? "" : "s"})
        </SafeLink>
      ) : (
        <span className="text-sm text-[var(--muted-foreground)]">(No reviews yet)</span>
      )}
    </div>
  );
}
