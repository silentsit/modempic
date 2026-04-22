import { HeroSection } from "@/components/home/hero-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { TrustBadgesSection } from "@/components/home/trust-badges";
import { BestSellersSection } from "@/components/home/best-sellers-section";
import { PaymentExplainerSection } from "@/components/home/payment-explainer-section";
import { AboutBlurbSection } from "@/components/home/about-blurb-section";
import { getSiteUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const site = getSiteUrl();

export const metadata: Metadata = {
  title: { default: "Modempic | Supplements, vitamins & herbal wellness", template: "%s | Modempic" },
  description:
    "Shop dietary supplements, vitamins, and herbs with clear labels and fair USD pricing. Secure checkout with crypto and card on-ramp options.",
  openGraph: { url: site, siteName: "Modempic", locale: "en_US" },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TestimonialsSection />
      <TrustBadgesSection />
      <BestSellersSection />
      <PaymentExplainerSection />
      <AboutBlurbSection />
    </>
  );
}
