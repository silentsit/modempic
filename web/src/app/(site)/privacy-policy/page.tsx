import type { Metadata } from "next";
import { LegalMarkdownPage } from "@/components/legal/legal-markdown-page";

import { pageSocialMetadata } from "@/lib/seo/page-metadata";
import { buildWebPageJsonLd } from "@/lib/seo/page-json-ld";
import { getSiteUrl } from "@/lib/site-url";

const PRIVACY_DESCRIPTION =
  "How Modempic uses order, account, cookie, and chat data — including guest checkout, PeptidePay, Paymento, and your privacy rights.";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: PRIVACY_DESCRIPTION,
  alternates: { canonical: "/privacy-policy" },
  ...pageSocialMetadata({
    title: "Privacy Policy",
    description: PRIVACY_DESCRIPTION,
    path: "/privacy-policy",
  }),
};

export default function PrivacyPolicyPage() {
  return (
    <LegalMarkdownPage
      file="privacy-policy.md"
      crumbs={[{ label: "Home", href: "/" }, { label: "Privacy policy" }]}
      related={[
        { href: "/terms-of-service", label: "Terms of service", description: "Site terms and conditions." },
        { href: "/refund-policy", label: "Return & refund policy", description: "Eligibility and process." },
        { href: "/contact", label: "Contact support", description: "Privacy questions: info@modempic.com." },
        { href: "/shop", label: "Shop", description: "Browse all products." },
      ]}
      jsonLd={buildWebPageJsonLd({
        name: "Privacy Policy",
        description: PRIVACY_DESCRIPTION,
        path: "/privacy-policy",
        baseUrl: getSiteUrl(),
      })}
    />
  );
}
