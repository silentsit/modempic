"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductReviewEligibility } from "@/lib/data/reviews";
import {
  computeRatingBreakdown,
  filterProductReviews,
  sortProductReviews,
  type ProductReviewSort,
} from "@/lib/reviews";
import { ProductAddReviewForm } from "@/components/shop/product-add-review-form";
import { StarsDisplay } from "@/components/shop/stars-display";
import { SafeLink } from "@/components/site/safe-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductReviewItem } from "@/components/shop/product-detail-tabs";

const PAGE_SIZE = 8;

const SORT_OPTIONS: { value: ProductReviewSort; label: string }[] = [
  { value: "recent", label: "Most recent" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];

function ReviewHistogram({ breakdown }: { breakdown: ReturnType<typeof computeRatingBreakdown> }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-2">
      {([5, 4, 3, 2, 1] as const).map((star) => {
        const row = breakdown[star];
        return (
          <div key={star} className="flex items-center gap-3 text-sm">
            <span className="w-12 shrink-0 text-[var(--muted-foreground)]">{star} star</span>
            <div className="h-3 flex-1 overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--muted)]/40">
              <div
                className="h-full rounded-sm bg-amber-400 transition-all"
                style={{ width: `${row.percent}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right tabular-nums text-[var(--muted-foreground)]">{row.percent}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function ProductReviewsPanel({
  productId,
  productSlug,
  reviews,
  eligibility,
}: {
  productId: string;
  productSlug: string;
  reviews: ProductReviewItem[];
  eligibility: ProductReviewEligibility;
}) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ProductReviewSort>("recent");
  const [page, setPage] = useState(1);

  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
  const breakdown = useMemo(() => computeRatingBreakdown(reviews), [reviews]);

  const filtered = useMemo(
    () => filterProductReviews(sortProductReviews(reviews, sort), search),
    [reviews, sort, search],
  );

  useEffect(() => {
    setPage(1);
  }, [search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageReviews = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/product/${productSlug}#reviews`)}`;

  function handleAddReviewClick() {
    if (eligibility.canSubmit) {
      setShowForm(true);
      return;
    }
    if (eligibility.reason === "sign_in") {
      window.location.href = loginHref;
    }
  }

  return (
    <div id="reviews" className="scroll-mt-28">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
        <div className="grid gap-8 md:grid-cols-[minmax(0,220px)_1fr] md:items-center">
          <div className="text-center md:text-left">
            <p className="text-5xl font-bold tabular-nums leading-none text-[var(--foreground)]">
              {reviewCount > 0 ? averageRating.toFixed(1) : "—"}
            </p>
            <StarsDisplay rating={averageRating} size="lg" className="mt-3 justify-center md:justify-start" />
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              Based on {reviewCount} review{reviewCount === 1 ? "" : "s"}
            </p>
            {eligibility.canSubmit ? (
              <Button type="button" variant="outline" className="mt-5 w-full sm:w-auto" onClick={handleAddReviewClick}>
                Add a review
              </Button>
            ) : eligibility.reason === "sign_in" ? (
              <Button type="button" variant="outline" className="mt-5 w-full sm:w-auto" onClick={handleAddReviewClick}>
                Add a review
              </Button>
            ) : (
              <p className="mt-5 text-sm text-[var(--muted-foreground)]">
                {eligibility.reason === "purchase_required"
                  ? "Only customers who purchased this product can leave a review."
                  : eligibility.existingStatus === "PENDING"
                    ? "Your review is pending moderation."
                    : eligibility.existingStatus === "APPROVED"
                      ? "You already reviewed this product."
                      : "You have already submitted a review for this product."}
              </p>
            )}
          </div>

          <ReviewHistogram breakdown={breakdown} />
        </div>
      </div>

      {showForm && eligibility.canSubmit ? (
        <div className="mt-6">
          <ProductAddReviewForm
            productId={productId}
            productSlug={productSlug}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : null}

      {reviewCount > 0 ? (
        <>
          <div className="mt-8">
            <label htmlFor="review-search" className="sr-only">
              Search customer reviews
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" />
                </svg>
              </span>
              <Input
                id="review-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer reviews"
                className="pl-10"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              {filtered.length === 0
                ? "No reviews match your search."
                : `${rangeStart}–${rangeEnd} of ${filtered.length} review${filtered.length === 1 ? "" : "s"}`}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="review-sort" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Sort by
              </label>
              <select
                id="review-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as ProductReviewSort)}
                className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ul className="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {pageReviews.map((r) => (
              <li key={r.id} className="py-5 first:pt-6 last:pb-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-[var(--foreground)]">
                    {r.authorName?.trim() || "Verified customer"}
                  </p>
                  <time className="text-sm text-[var(--muted-foreground)]" dateTime={r.createdAtIso}>
                    {r.createdAtLabel}
                  </time>
                </div>
                <StarsDisplay rating={r.rating} size="sm" className="mt-2" />
                {r.title ? <p className="mt-2 font-medium text-[var(--foreground)]">{r.title}</p> : null}
                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">{r.body}</p>
              </li>
            ))}
          </ul>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm tabular-nums text-[var(--muted-foreground)]">
                Page {safePage} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <p className="mt-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-6 py-10 text-center text-sm text-[var(--muted-foreground)]">
          No reviews yet.{" "}
          {eligibility.canSubmit ? (
            <>
              Be the first to{" "}
              <button type="button" className="font-medium text-[var(--primary)] underline-offset-2 hover:underline" onClick={() => setShowForm(true)}>
                add a review
              </button>
              .
            </>
          ) : eligibility.reason === "sign_in" ? (
            <>
              <SafeLink href={loginHref} className="font-medium text-[var(--primary)] underline-offset-2 hover:underline">
                Sign in
              </SafeLink>{" "}
              to leave the first review after purchase.
            </>
          ) : (
            "Approved reviews appear here after moderation."
          )}
        </p>
      )}
    </div>
  );
}
