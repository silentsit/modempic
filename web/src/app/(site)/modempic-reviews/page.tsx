import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { RelatedLinks } from "@/components/seo/related-links";
import { ReviewsHubCard } from "@/components/reviews/reviews-hub-card";
import { StarsDisplay } from "@/components/shop/stars-display";
import { Container } from "@/components/site/container";
import { SafeLink } from "@/components/site/safe-link";
import { getReviewsHubPage } from "@/lib/data/reviews";
import { pageDocumentTitle, pageSocialMetadata } from "@/lib/seo/page-metadata";
import {
  buildReviewsHubJsonLd,
  isReviewsHubIndexable,
  parseReviewsHubQuery,
  REVIEWS_HUB_DESCRIPTION,
  REVIEWS_HUB_PATH,
  REVIEWS_HUB_TITLE,
  reviewsHubHref,
  type ReviewsHubStar,
} from "@/lib/reviews-hub";
import { getSiteUrl } from "@/lib/site-url";
import { titleCaseHeading } from "@/lib/text/heading-title-case";

export const revalidate = 3600;

type Props = {
  searchParams: Promise<{ page?: string | string[]; rating?: string | string[] }>;
};

const heading = titleCaseHeading(REVIEWS_HUB_TITLE);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = parseReviewsHubQuery(await searchParams);
  const indexable = isReviewsHubIndexable(query);
  return {
    title: pageDocumentTitle(REVIEWS_HUB_TITLE),
    description: REVIEWS_HUB_DESCRIPTION,
    alternates: { canonical: REVIEWS_HUB_PATH },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    ...pageSocialMetadata({
      title: REVIEWS_HUB_TITLE,
      description: REVIEWS_HUB_DESCRIPTION,
      path: REVIEWS_HUB_PATH,
    }),
  };
}

const STAR_FILTERS: Array<{ label: string; rating?: ReviewsHubStar }> = [
  { label: "All" },
  { label: "5 star", rating: 5 },
  { label: "4 star", rating: 4 },
  { label: "3 star", rating: 3 },
  { label: "2 star", rating: 2 },
  { label: "1 star", rating: 1 },
];

export default async function ModempicReviewsPage({ searchParams }: Props) {
  const query = parseReviewsHubQuery(await searchParams);
  const hub = await getReviewsHubPage(query);
  const site = getSiteUrl();
  const rangeStart = hub.totalCount === 0 ? 0 : (hub.page - 1) * hub.pageSize + 1;
  const rangeEnd = Math.min(hub.page * hub.pageSize, hub.totalCount);

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: heading }]} />

      <header className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Customer reviews</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{heading}</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          Modempic reviews on this page are the approved customer comments already published on our product pages:
          rating, date, and the item they ordered. Unpublished or rejected reviews stay off this list.
        </p>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          Leave a review from the product page after a completed order. Staff check new customer reviews before they
          appear here or on{" "}
          <SafeLink href="/shop" className="font-medium text-accent underline-offset-2 hover:text-accent-hover hover:underline">
            the shop.
          </SafeLink>
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8" aria-labelledby="reviews-summary-heading">
        <h2 id="reviews-summary-heading" className="sr-only">
          Rating summary
        </h2>
        <div className="grid gap-8 md:grid-cols-[minmax(0,220px)_1fr] md:items-center">
          <div>
            <p className="text-5xl font-bold tabular-nums leading-none text-foreground">
              {hub.siteWide.reviewCount > 0 ? hub.siteWide.averageRating.toFixed(1) : "—"}
            </p>
            <StarsDisplay rating={hub.siteWide.averageRating} size="lg" className="mt-3" />
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Based on {hub.siteWide.reviewCount} review{hub.siteWide.reviewCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-2">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const row = hub.siteWide.breakdown[star];
              return (
                <SafeLink
                  key={star}
                  href={reviewsHubHref({ page: 1, rating: star })}
                  className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-accent"
                >
                  <span className="w-12 shrink-0 text-muted-foreground">{star} star</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-sm border border-border bg-muted/40">
                    <div className="h-full rounded-sm bg-amber-400" style={{ width: `${row.percent}%` }} />
                  </div>
                  <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">{row.percent}%</span>
                </SafeLink>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {hub.totalCount === 0
            ? query.rating
              ? `No ${query.rating}-star reviews yet.`
              : "No approved reviews yet."
            : `${rangeStart}–${rangeEnd} of ${hub.totalCount} review${hub.totalCount === 1 ? "" : "s"}`}
        </p>
        <nav aria-label="Filter reviews by rating" className="flex flex-wrap gap-2">
          {STAR_FILTERS.map((filter) => {
            const active = query.rating === filter.rating || (!filter.rating && !query.rating);
            const href = reviewsHubHref({ page: 1, rating: filter.rating });
            return (
              <SafeLink
                key={filter.label}
                href={href}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {filter.label}
              </SafeLink>
            );
          })}
        </nav>
      </div>

      <h2 className="mt-10 text-xl font-semibold tracking-tight text-foreground">
        {titleCaseHeading("Latest approved reviews")}
      </h2>

      {hub.reviews.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {hub.reviews.map((review) => (
            <li key={review.id}>
              <ReviewsHubCard review={review} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
          {query.rating ? (
            <>
              Try{" "}
              <SafeLink href={REVIEWS_HUB_PATH} className="font-medium text-accent underline-offset-2 hover:underline">
                all Modempic reviews
              </SafeLink>{" "}
              or leave one from a product you purchased.
            </>
          ) : (
            <>
              Approved reviews appear here after moderation. Browse{" "}
              <SafeLink href="/shop" className="font-medium text-accent underline-offset-2 hover:underline">
                products
              </SafeLink>{" "}
              to read ratings on each page.
            </>
          )}
        </p>
      )}

      {hub.totalPages > 1 ? (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Reviews pagination">
          {hub.page <= 1 ? (
            <span className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm text-muted-foreground opacity-50">
              Previous
            </span>
          ) : (
            <SafeLink
              href={reviewsHubHref({ page: hub.page - 1, rating: query.rating })}
              className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm text-foreground hover:border-accent hover:text-accent"
            >
              Previous
            </SafeLink>
          )}
          <span className="text-sm tabular-nums text-muted-foreground">
            Page {hub.page} of {hub.totalPages}
          </span>
          {hub.page >= hub.totalPages ? (
            <span className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm text-muted-foreground opacity-50">
              Next
            </span>
          ) : (
            <SafeLink
              href={reviewsHubHref({ page: hub.page + 1, rating: query.rating })}
              className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm text-foreground hover:border-accent hover:text-accent"
            >
              Next
            </SafeLink>
          )}
        </nav>
      ) : null}

      <RelatedLinks
        links={[
          { href: "/shop", label: "Shop", description: "Browse products and leave a review after purchase." },
          { href: "/modafinil-price-comparison", label: "Price comparison", description: "Pack prices across the catalog." },
          { href: "/shipping", label: "Shipping", description: "Transit windows and tracking." },
          { href: "/about", label: "About Modempic", description: "Who we are and how we sell." },
        ]}
      />

      <JsonLd
        data={buildReviewsHubJsonLd({
          name: heading,
          description: REVIEWS_HUB_DESCRIPTION,
          path: REVIEWS_HUB_PATH,
          baseUrl: site,
          siteWide: hub.siteWide,
          reviews: hub.reviews,
        })}
      />
    </Container>
  );
}
