import { HeroSection } from "@/components/home/hero-section";
import { CategoryShopSection } from "@/components/home/category-shop-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { TrustBeltSection } from "@/components/home/trust-belt";
import { BestSellersSection } from "@/components/home/best-sellers-section";
import { PaymentExplainerSection } from "@/components/home/payment-explainer-section";
import { AboutBlurbSection } from "@/components/home/about-blurb-section";
import { getSiteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const site = getSiteUrl();

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Modempic | Medicine shouldn't be a privilege" },
  description:
    "Hard-to-find medicines at guaranteed best prices. Clear labels, pack-size pricing, and secure card or crypto checkout.",
  openGraph: {
    type: "website",
    url: site,
    siteName: "Modempic",
    locale: "en_US",
    title: "Modempic | Medicine shouldn't be a privilege",
    description:
      "Hard-to-find medicines at guaranteed best prices. Clear labels, pack-size pricing, and secure card or crypto checkout.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Modempic | Medicine shouldn't be a privilege",
    description:
      "Hard-to-find medicines at guaranteed best prices. Clear labels, pack-size pricing, and secure card or crypto checkout.",
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
      <HeroSection />
      <TrustBeltSection />
      <CategoryShopSection />
      <TestimonialsSection />
      <BestSellersSection />
      <PaymentExplainerSection />
      <AboutBlurbSection />
    </>
  );
}
