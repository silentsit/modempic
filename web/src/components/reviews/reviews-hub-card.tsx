import { StarsDisplay } from "@/components/shop/stars-display";
import { SafeLink } from "@/components/site/safe-link";
import type { StorefrontReview } from "@/lib/reviews-hub";

export function ReviewsHubCard({ review }: { review: StorefrontReview }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground">{review.authorName}</p>
          <StarsDisplay rating={review.rating} size="sm" className="mt-2" />
        </div>
        <time className="text-sm text-muted-foreground" dateTime={review.createdAtIso}>
          {review.createdAtLabel}
        </time>
      </div>
      {review.title ? <p className="mt-3 font-medium text-foreground">{review.title}</p> : null}
      <p className="mt-2 text-sm leading-relaxed text-foreground">{review.body}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        Reviewed{" "}
        <SafeLink
          href={`/product/${review.productSlug}#reviews`}
          className="font-medium text-accent underline-offset-2 hover:text-accent-hover hover:underline"
        >
          {review.productName}
        </SafeLink>
      </p>
    </article>
  );
}
