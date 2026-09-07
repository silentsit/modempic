import type { Metadata } from "next";
import { LegalMarkdownPage } from "@/components/legal/legal-markdown-page";

import { pageSocialMetadata } from "@/lib/seo/page-metadata";
import { buildWebPageJsonLd } from "@/lib/seo/page-json-ld";
import { getSiteUrl } from "@/lib/site-url";

const SHIPPING_DESCRIPTION = "Shipping timelines, tracking, customs, and FAQs for Modempic orders.";

export const metadata: Metadata = {
  title: "Shipping & Handling",
  description: SHIPPING_DESCRIPTION,
  alternates: { canonical: "/shipping" },
  ...pageSocialMetadata({
    title: "Shipping & Handling",
    description: SHIPPING_DESCRIPTION,
    path: "/shipping",
  }),
};

export default function ShippingPage() {
  return (
    <LegalMarkdownPage
      file="shipping.md"
      crumbs={[{ label: "Home", href: "/" }, { label: "Shipping" }]}
      related={[
        { href: "/modafinil-price-comparison", label: "Modafinil price comparison", description: "Live pack prices before you ship." },
        { href: "/shipping/united-states", label: "Shipping to the United States", description: "Transit band and cited US status." },
        { href: "/shipping/united-kingdom", label: "Shipping to the United Kingdom", description: "Transit band and MHRA note." },
        { href: "/shipping/australia", label: "Shipping to Australia", description: "Transit band and TGA note." },
        { href: "/refund-policy", label: "Return & refund policy", description: "Eligibility and process." },
        { href: "/faq", label: "FAQ", description: "Common questions about orders." },
        { href: "/contact", label: "Contact support", description: "Email reply within one business day." },
        { href: "/shop", label: "Shop", description: "Browse all products." },
      ]}
      jsonLd={buildWebPageJsonLd({
        name: "Shipping & Handling",
        description: SHIPPING_DESCRIPTION,
        path: "/shipping",
        baseUrl: getSiteUrl(),
      })}
    />
  );
}
