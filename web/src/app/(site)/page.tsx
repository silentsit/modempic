import { HeroSection } from "@/components/home/hero-section";
import { CategoryShopSection } from "@/components/home/category-shop-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { TrustBeltSection } from "@/components/home/trust-belt";
import { BestSellersSection } from "@/components/home/best-sellers-section";
import { PaymentExplainerSection } from "@/components/home/payment-explainer-section";
import { AboutBlurbSection } from "@/components/home/about-blurb-section";
import { JsonLd } from "@/components/seo/json-ld";
import { DEFAULT_SHARE_IMAGE } from "@/lib/seo/page-metadata";
import { buildWebPageJsonLd, siteGraphIds } from "@/lib/seo/page-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { titleCaseHeading } from "@/lib/text/heading-title-case";
import type { Metadata } from "next";

const site = getSiteUrl();

export const revalidate = 3600;

const HOME_SEO_TITLE = "Buy Modafinil Reddit: What People Are Actually Searching For";
const HOME_SEO_DESCRIPTION =
  "Searching “Buy Modafinil Reddit”? See what people are actually trying to find, what Reddit discussions reveal, and why you shouldn't trust the threads.";

export const metadata: Metadata = {
  title: { absolute: HOME_SEO_TITLE },
  description: HOME_SEO_DESCRIPTION,
  openGraph: {
    type: "website",
    url: site,
    siteName: "Modempic",
    locale: "en_US",
    title: HOME_SEO_TITLE,
    description: HOME_SEO_DESCRIPTION,
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_SEO_TITLE,
    description: HOME_SEO_DESCRIPTION,
    images: [DEFAULT_SHARE_IMAGE.url],
  },
  alternates: { canonical: "/" },
};

/**
 * Semantic structure: <main> is provided by SiteShell; this page contributes
 * one H1 (HeroSection) and H2-per-section, each section labelled via
 * aria-labelledby. Do not add a <main> wrapper here.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd
        data={buildWebPageJsonLd({
          name: titleCaseHeading(HOME_SEO_TITLE),
          description: HOME_SEO_DESCRIPTION,
          path: "/",
          baseUrl: site,
          about: { "@id": siteGraphIds(site).organizationId },
        })}
      />
      <HeroSection />
      <TrustBeltSection />
      <TestimonialsSection />
      <BestSellersSection />
      <PaymentExplainerSection />
      <AboutBlurbSection />
      <CategoryShopSection />
    </>
  );
}
