import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FeaturedBlogPosts } from "@/components/blog/featured-blog-posts";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { STOREFRONT_CATEGORIES } from "@/lib/catalog/storefront-categories";
import { pageSocialMetadata } from "@/lib/seo/page-metadata";
import { ShopCategoryIntroLinks } from "@/lib/shop-category-links";
import { getSiteUrl } from "@/lib/site-url";
import { titleCaseHeading } from "@/lib/text/heading-title-case";

const ABOUT_DESCRIPTION =
  "Modempic sells hard-to-find medicines in USD, with pack-size pricing and card or crypto checkout. We ship worldwide.";

const bodyLinkClassName =
  "font-medium text-accent underline-offset-2 transition-colors hover:text-accent-hover hover:underline";

export const metadata: Metadata = {
  title: "About Modempic",
  description: ABOUT_DESCRIPTION,
  alternates: { canonical: "/about" },
  ...pageSocialMetadata({ title: "About Modempic", description: ABOUT_DESCRIPTION, path: "/about" }),
};

export default function AboutPage() {
  const categories = STOREFRONT_CATEGORIES;
  const root = getSiteUrl().replace(/\/$/, "");
  const aboutLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${root}/about`,
    url: `${root}/about`,
    name: "About Modempic",
    description: ABOUT_DESCRIPTION,
    isPartOf: { "@type": "WebSite", name: "Modempic", url: `${root}/` },
    about: { "@type": "Organization", name: "Modempic", url: `${root}/` },
  };

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "About" }]} />

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Company</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">About</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          We started Modempic because the medicines people actually need are too often the hardest to find and the most
          overpriced. Somewhere between the manufacturer and the person who needs the order, the price stopped making
          sense. We exist to cut that distance down.
        </p>
      </div>

      <div className="mt-10 max-w-2xl space-y-4 leading-relaxed text-muted-foreground">
        <p>
          The team behind Fox Dose and Noofox built this shop. Prices are in USD by pack size. Checkout is{" "}
          <Link href="/how-to-pay" className={bodyLinkClassName}>
            card by default
          </Link>
          , crypto if you want it.
        </p>
        <p>
          Shop by category: <ShopCategoryIntroLinks categories={categories} />. See{" "}
          <Link href="/shop/best-sellers" className={bodyLinkClassName}>
            best sellers
          </Link>{" "}
          or the{" "}
          <Link href="/shop" className={bodyLinkClassName}>
            full catalog
          </Link>
          .
        </p>
      </div>

      <section className="mt-12 max-w-2xl" aria-labelledby="ordering-heading">
        <h2 id="ordering-heading" className="text-xl font-semibold tracking-tight text-foreground">
          {titleCaseHeading("How ordering works")}
        </h2>
        <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
          <p>
            You need an account so the order stays tied to your email. We ship worldwide. Payment happens on
            a hosted page. The order is marked paid after the provider verifies it, not when you click place order.
          </p>
          <p>
            Tracking and returns are on{" "}
            <Link href="/shipping" className={bodyLinkClassName}>
              shipping
            </Link>{" "}
            and the{" "}
            <Link href="/refund-policy" className={bodyLinkClassName}>
              return policy
            </Link>
            . Common questions sit in the{" "}
            <Link href="/faq" className={bodyLinkClassName}>
              FAQ
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mt-12 max-w-2xl" aria-labelledby="pages-heading">
        <h2 id="pages-heading" className="text-xl font-semibold tracking-tight text-foreground">
          {titleCaseHeading("What product pages are for")}
        </h2>
        <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
          <p>
            Catalog and ordering information. Not a diagnosis, and not a treatment plan. Read the label. Talk to a
            clinician about your own situation.
          </p>
          <p>
            Order questions that are not medical go to{" "}
            <Link href="/contact" className={bodyLinkClassName}>
              contact
            </Link>
            . We reply by email.
          </p>
        </div>
      </section>

      <RelatedLinks
        heading="Related on Modempic"
        links={[
          { href: "/shop", label: "Shop", description: "Browse the catalog by category." },
          { href: "/how-to-pay", label: "How to pay", description: "Card checkout, crypto, and confirmation." },
          { href: "/shipping", label: "Shipping & handling", description: "Timelines, tracking, and customs." },
          { href: "/contact", label: "Contact", description: "Email support. No medical advice by message." },
        ]}
      />

      <FeaturedBlogPosts />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutLd) }} />
    </Container>
  );
}
