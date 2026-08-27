import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FeaturedBlogPosts } from "@/components/blog/featured-blog-posts";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { pageSocialMetadata } from "@/lib/seo/page-metadata";
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

const sectionDividerClassName = "border-t border-border pt-10";

export default function AboutPage() {
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
          Modempic was built by the experienced team behind <strong>Fox Dose</strong> and <strong>Noofox</strong> to
          provide reliable, streamlined access to specialized health, wellness, and cognitive products worldwide.
        </p>
        <p>We combine verified product sourcing with a transparent, privacy-first shopping experience.</p>
      </div>

      <section className={`mt-10 max-w-2xl ${sectionDividerClassName}`} aria-labelledby="catalog-heading">
        <h2 id="catalog-heading" className="text-xl font-semibold tracking-tight text-foreground">
          {titleCaseHeading("Explore the catalog")}
        </h2>
        <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
          <p>
            All prices are listed in <strong>USD</strong> with transparent tier pricing based on pack size.
          </p>
          <ul className="space-y-2 pl-1">
            <li>
              🧠{" "}
              <Link href="/shop/nootropics" className={bodyLinkClassName}>
                Nootropics
              </Link>{" "}
              — Cognitive support and focus
            </li>
            <li>
              🛡️{" "}
              <Link href="/shop/anti-epileptic" className={bodyLinkClassName}>
                Anti-Epileptic
              </Link>{" "}
              — Specialized neurological support
            </li>
            <li>
              ✨{" "}
              <Link href="/shop/skincare" className={bodyLinkClassName}>
                Skincare
              </Link>{" "}
              — Targeted dermatological care
            </li>
            <li>
              ❤️{" "}
              <Link href="/shop/sexual-health" className={bodyLinkClassName}>
                Sexual Health
              </Link>{" "}
              — Vitality and wellness formulations
            </li>
          </ul>
          <p>
            Looking for our most popular options? Check out our{" "}
            <Link href="/shop/best-sellers" className={bodyLinkClassName}>
              Best Sellers
            </Link>{" "}
            or browse the{" "}
            <Link href="/shop" className={bodyLinkClassName}>
              Full Catalog
            </Link>
            .
          </p>
        </div>
      </section>

      <section className={`mt-10 max-w-2xl ${sectionDividerClassName}`} aria-labelledby="ordering-heading">
        <h2 id="ordering-heading" className="text-xl font-semibold tracking-tight text-foreground">
          {titleCaseHeading("How ordering & payment works")}
        </h2>
        <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
          <p>We keep the checkout process straightforward, discreet, and secure:</p>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              <strong>Guest Checkout:</strong> No account creation required—we only ask for a valid email address to
              send your order confirmation and tracking updates.
            </li>
            <li>
              <strong>Flexible Payments:</strong> We accept{" "}
              <Link href="/how-to-pay" className={bodyLinkClassName}>
                card payments by default
              </Link>
              , as well as cryptocurrency for privacy and convenience.
            </li>
            <li>
              <strong>Hosted & Verified:</strong> Payments are processed securely on a dedicated hosted page. To
              ensure security, orders are confirmed as paid once verified by our payment processor.
            </li>
            <li>
              <strong>Worldwide Shipping:</strong> We ship globally with tracked fulfillment and <strong>100% free shipping</strong> on every order. Review full delivery
              timelines and regional coverage on our{" "}
              <Link href="/shipping" className={bodyLinkClassName}>
                Shipping Information
              </Link>{" "}
              page.
            </li>
          </ul>
          <p>
            For details on exchanges or returns, view our{" "}
            <Link href="/refund-policy" className={bodyLinkClassName}>
              Refund Policy
            </Link>
            . Have more questions? Visit our{" "}
            <Link href="/faq" className={bodyLinkClassName}>
              FAQ
            </Link>
            .
          </p>
        </div>
      </section>

      <section className={`mt-10 max-w-2xl ${sectionDividerClassName}`} aria-labelledby="disclaimer-heading">
        <h2 id="disclaimer-heading" className="text-xl font-semibold tracking-tight text-foreground">
          {titleCaseHeading("Product guidance & medical disclaimer")}
        </h2>
        <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
          <p>
            Our product pages are designed to provide clear catalog specifications and ordering details.{" "}
            <strong>They are not intended as medical advice, diagnosis, or treatment plans.</strong>
          </p>
          <p>
            Always read the product packaging and label carefully, and consult a qualified healthcare professional
            regarding your specific health circumstances before starting any new regimen.
          </p>
        </div>
      </section>

      <section className={`mt-10 max-w-2xl ${sectionDividerClassName}`} aria-labelledby="help-heading">
        <h2 id="help-heading" className="text-xl font-semibold tracking-tight text-foreground">
          {titleCaseHeading("Need help?")}
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          For questions regarding your order, shipping, or payments, reach out to our team via our{" "}
          <Link href="/contact" className={bodyLinkClassName}>
            Contact Page
          </Link>
          . We respond promptly by email.
        </p>
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
