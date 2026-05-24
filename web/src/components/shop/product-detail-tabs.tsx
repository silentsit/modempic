"use client";

import { useEffect, useState } from "react";
import { ProductReviewsPanel } from "@/components/shop/product-reviews-panel";
import type { ProductReviewEligibility } from "@/lib/data/reviews";

export type ProductReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string | null;
  createdAtIso: string;
  createdAtLabel: string;
};

type TabId = "description" | "reviews";

export function ProductDetailTabs({
  bodyHtml,
  longDescParagraphs,
  reviews,
  productId,
  productSlug,
  reviewEligibility,
}: {
  bodyHtml: string | null;
  longDescParagraphs: string[];
  reviews: ProductReviewItem[];
  productId: string;
  productSlug: string;
  reviewEligibility: ProductReviewEligibility;
}) {
  const [tab, setTab] = useState<TabId>("description");

  /** Sync tab from `#reviews` / `#description` after hydration (never during SSR/first paint). */
  useEffect(() => {
    const syncFromHash = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (h === "reviews") setTab("reviews");
      else if (h === "description" || h === "") setTab("description");
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  function select(next: TabId) {
    setTab(next);
    const id = next === "reviews" ? "reviews" : "description";
    window.history.replaceState(null, "", `#${id}`);
  }

  const hasDescription = Boolean(bodyHtml?.trim().length || longDescParagraphs.length > 0);

  return (
    <section
      id="product-detail-tabs"
      className="mt-14 border-t border-[var(--border)] pt-10 scroll-mt-24"
      suppressHydrationWarning
    >
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-px" role="tablist" aria-label="Product details">
        <button
          type="button"
          role="tab"
          id="tab-description"
          aria-selected={tab === "description"}
          aria-controls="panel-description"
          tabIndex={tab === "description" ? 0 : -1}
          className={`relative -mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] ${
            tab === "description"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => select("description")}
        >
          Description
        </button>
        <button
          type="button"
          role="tab"
          id="tab-reviews"
          aria-selected={tab === "reviews"}
          aria-controls="panel-reviews"
          tabIndex={tab === "reviews" ? 0 : -1}
          className={`relative -mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] ${
            tab === "reviews"
              ? "border-[var(--primary)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
          onClick={() => select("reviews")}
        >
          Reviews
          {reviews.length > 0 ? (
            <span className="ml-1.5 tabular-nums text-[var(--muted-foreground)]">({reviews.length})</span>
          ) : null}
        </button>
      </div>

      <div
        id="panel-description"
        role="tabpanel"
        aria-labelledby="tab-description"
        hidden={tab !== "description"}
        className="mt-8 w-full"
      >
        {hasDescription ? (
          bodyHtml ? (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
              <div
                className="product-body-html"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
                suppressHydrationWarning
              />
            </div>
          ) : (
            <div className="space-y-7 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
              {longDescParagraphs.map((para, i) => (
                <p key={i} className="product-long-desc-para text-base leading-relaxed text-[var(--foreground)]">
                  {para}
                </p>
              ))}
            </div>
          )
        ) : (
          <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-6 py-10 text-center text-sm text-[var(--muted-foreground)]">
            No description available for this product yet.
          </p>
        )}
      </div>

      <div
        id="panel-reviews"
        role="tabpanel"
        aria-labelledby="tab-reviews"
        hidden={tab !== "reviews"}
        className="mt-8 w-full"
      >
        <ProductReviewsPanel
          productId={productId}
          productSlug={productSlug}
          reviews={reviews}
          eligibility={reviewEligibility}
        />
      </div>
    </section>
  );
}
