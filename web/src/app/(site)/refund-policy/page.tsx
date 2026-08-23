import type { Metadata } from "next";
import { LegalMarkdownPage } from "@/components/legal/legal-markdown-page";

import { pageSocialMetadata } from "@/lib/seo/page-metadata";

const REFUND_DESCRIPTION = "Eligibility, conditions, and process for returns and refunds at Modempic.";

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description: REFUND_DESCRIPTION,
  alternates: { canonical: "/refund-policy" },
  ...pageSocialMetadata({
    title: "Return & Refund Policy",
    description: REFUND_DESCRIPTION,
    path: "/refund-policy",
  }),
};

export default function RefundPolicyPage() {
  return (
    <LegalMarkdownPage
      file="return-policy.md"
      crumbs={[{ label: "Home", href: "/" }, { label: "Return & refund policy" }]}
      related={[
        { href: "/shipping", label: "Shipping & handling", description: "Timelines and tracking." },
        { href: "/faq", label: "FAQ", description: "Common questions about orders." },
        { href: "/contact", label: "Contact support", description: "Reach the team by email." },
        { href: "/terms-of-service", label: "Terms of service", description: "Site terms and conditions." },
      ]}
    />
  );
}
