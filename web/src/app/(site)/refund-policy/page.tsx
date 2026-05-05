import type { Metadata } from "next";
import { LegalMarkdownPage } from "@/components/legal/legal-markdown-page";

export const metadata: Metadata = {
  title: "Return & refund policy",
  description: "Eligibility, conditions, and process for returns and refunds at Modempic.",
  alternates: { canonical: "/refund-policy" },
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
