import { HeroSection } from "@/components/home/hero-section";
import { CategoryShopSection } from "@/components/home/category-shop-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { TrustBadgesSection } from "@/components/home/trust-badges";
import { BestSellersSection } from "@/components/home/best-sellers-section";
import { PaymentExplainerSection } from "@/components/home/payment-explainer-section";
import { AboutBlurbSection } from "@/components/home/about-blurb-section";
import { getSiteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const site = getSiteUrl();

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { default: "Modempic | Clear catalog and secure checkout", template: "%s | Modempic" },
  description:
    "Browse Modempic's catalog with clear product labels, pack-size options, USD pricing, and secure crypto checkout.",
  openGraph: { url: site, siteName: "Modempic", locale: "en_US", type: "website" },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoryShopSection />
      <TestimonialsSection />
      <BestSellersSection />
      <TrustBadgesSection />
      <PaymentExplainerSection />
      <AboutBlurbSection />
    </>
  );
}
