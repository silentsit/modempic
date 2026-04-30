"use client";

import { useEffect, useLayoutEffect, useState } from "react";

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
}: {
  bodyHtml: string | null;
  longDescParagraphs: string[];
  reviews: ProductReviewItem[];
}) {
  const [tab, setTab] = useState<TabId>("description");

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.replace(/^#/, "") === "reviews") {
      setTab("reviews");
    }
  }, []);

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (h === "reviews") setTab("reviews");
      if (h === "description" || h === "") setTab("description");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function select(next: TabId) {
    setTab(next);
    const id = next === "reviews" ? "reviews" : "description";
    window.history.replaceState(null, "", `#${id}`);
  }

  const hasDescription = Boolean(bodyHtml?.trim().length || longDescParagraphs.length > 0);

  return (
    <section id="product-detail-tabs" className="mt-14 border-t border-[var(--border)] pt-10 scroll-mt-24">
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
              <div className="product-body-html" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
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
        <div id="reviews" className="scroll-mt-28">
          {reviews.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-6 py-10 text-center text-sm text-[var(--muted-foreground)]">
              No reviews yet. Approved reviews appear here after moderation.
            </p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{r.rating} / 5</p>
                    <time className="text-xs text-[var(--muted-foreground)]" dateTime={r.createdAtIso}>
                      {r.createdAtLabel}
                    </time>
                  </div>
                  {r.title ? <p className="mt-2 font-semibold text-[var(--foreground)]">{r.title}</p> : null}
                  <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">{r.body}</p>
                  <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                    {r.authorName?.trim() ? `— ${r.authorName.trim()}` : "— Verified customer"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
