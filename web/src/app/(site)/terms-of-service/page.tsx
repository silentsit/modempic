import type { Metadata } from "next";
import { LegalMarkdownPage } from "@/components/legal/legal-markdown-page";

import { pageSocialMetadata } from "@/lib/seo/page-metadata";
import { buildWebPageJsonLd } from "@/lib/seo/page-json-ld";
import { getSiteUrl } from "@/lib/site-url";

const TERMS_DESCRIPTION =
  "Modempic terms: 18+ shop, guest checkout, card or crypto payment, shipping, returns, and your legal responsibilities.";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: TERMS_DESCRIPTION,
  alternates: { canonical: "/terms-of-service" },
  ...pageSocialMetadata({
    title: "Terms of Service",
    description: TERMS_DESCRIPTION,
    path: "/terms-of-service",
  }),
};

export default function TermsOfServicePage() {
  return (
    <LegalMarkdownPage
      file="terms-of-service.md"
      crumbs={[{ label: "Home", href: "/" }, { label: "Terms of service" }]}
      related={[
        { href: "/privacy-policy", label: "Privacy policy", description: "How we handle your data." },
        { href: "/refund-policy", label: "Return & refund policy", description: "Eligibility and process." },
        { href: "/shipping", label: "Shipping & handling", description: "Timelines and tracking." },
        { href: "/contact", label: "Contact support", description: "Reach the team by email." },
      ]}
      jsonLd={buildWebPageJsonLd({
        name: "Terms of Service",
        description: TERMS_DESCRIPTION,
        path: "/terms-of-service",
        baseUrl: getSiteUrl(),
      })}
    />
  );
}
