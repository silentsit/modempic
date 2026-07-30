"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ProductReviewsPanel } from "@/components/shop/product-reviews-panel";
import type { ProductPdpTabContent, ProductSpecRow } from "@/lib/catalog/product-pdp-tabs";
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

type TabId = "description" | "specs" | "shipping" | "faq" | "reviews";

export function ProductDetailTabs({
  bodyHtml,
  longDescParagraphs,
  reviews,
  productId,
  productSlug,
  reviewEligibility,
  tabContent,
}: {
  bodyHtml: string | null;
  longDescParagraphs: string[];
  reviews: ProductReviewItem[];
  productId: string;
  productSlug: string;
  reviewEligibility: ProductReviewEligibility;
  tabContent: ProductPdpTabContent;
}) {
  const availableTabs = useMemo(() => {
    const tabs: TabId[] = ["description"];
    if (tabContent.specs.length > 0) tabs.push("specs");
    if (tabContent.shippingNotes || tabContent.storageNotes) tabs.push("shipping");
    if (tabContent.faqs.length > 0) tabs.push("faq");
    tabs.push("reviews");
    return tabs;
  }, [tabContent]);

  const [tab, setTab] = useState<TabId>("description");

  useEffect(() => {
    const syncFromHash = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (!h || h === "description") setTab("description");
      else if (availableTabs.includes(h as TabId)) setTab(h as TabId);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [availableTabs]);

  function select(next: TabId) {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  const hasDescription = Boolean(bodyHtml?.trim().length || longDescParagraphs.length > 0);

  const tabLabels: Record<TabId, string> = {
    description: "Description",
    specs: "Specifications",
    shipping: "Shipping",
    faq: "FAQ",
    reviews: "Reviews",
  };

  return (
    <section
      id="product-detail-tabs"
      className="mt-14 border-t border-[var(--border)] pt-10 scroll-mt-24"
      suppressHydrationWarning
    >
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-px" role="tablist" aria-label="Product details">
        {availableTabs.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            className={`relative -mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] ${
              tab === id
                ? "border-[var(--primary)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
            onClick={() => select(id)}
          >
            {tabLabels[id]}
            {id === "reviews" && reviews.length > 0 ? (
              <span className="ml-1.5 tabular-nums text-[var(--muted-foreground)]">({reviews.length})</span>
            ) : null}
          </button>
        ))}
      </div>

      <TabPanel id="description" active={tab === "description"} labelledBy="tab-description">
        {hasDescription ? (
          bodyHtml ? (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
              <div className="product-body-html" dangerouslySetInnerHTML={{ __html: bodyHtml }} suppressHydrationWarning />
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
      </TabPanel>

      <TabPanel id="specs" active={tab === "specs"} labelledBy="tab-specs">
        <SpecGrid specs={tabContent.specs} />
      </TabPanel>

      <TabPanel id="shipping" active={tab === "shipping"} labelledBy="tab-shipping">
        <div className="grid gap-4 lg:grid-cols-2">
          {tabContent.shippingNotes ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Shipping & ordering notes</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--muted-foreground)]">
                {tabContent.shippingNotes}
              </p>
            </div>
          ) : null}
          {tabContent.storageNotes ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Storage notes</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--muted-foreground)]">
                {tabContent.storageNotes}
              </p>
            </div>
          ) : null}
        </div>
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          General shipping guidance is on{" "}
          <Link href="/shipping" className="font-medium text-[var(--primary)] underline-offset-2 hover:underline">
            our shipping page
          </Link>
          .
        </p>
      </TabPanel>

      <TabPanel id="faq" active={tab === "faq"} labelledBy="tab-faq">
        <div className="grid gap-4 md:grid-cols-2">
          {tabContent.faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">{faq.q}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{faq.a}</p>
            </div>
          ))}
        </div>
      </TabPanel>

      <TabPanel id="reviews" active={tab === "reviews"} labelledBy="tab-reviews">
        <ProductReviewsPanel
          productId={productId}
          productSlug={productSlug}
          reviews={reviews}
          eligibility={reviewEligibility}
        />
      </TabPanel>
    </section>
  );
}

function TabPanel({
  id,
  active,
  labelledBy,
  children,
}: {
  id: string;
  active: boolean;
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    <div
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={labelledBy}
      hidden={!active}
      className="mt-8 w-full"
    >
      {children}
    </div>
  );
}

function SpecGrid({ specs }: { specs: ProductSpecRow[] }) {
  if (specs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-6 py-10 text-center text-sm text-[var(--muted-foreground)]">
        No structured specifications listed for this product yet.
      </p>
    );
  }
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {specs.map((spec) => (
        <div key={spec.label} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{spec.label}</dt>
          <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
