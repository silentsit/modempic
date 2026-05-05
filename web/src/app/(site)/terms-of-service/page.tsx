import type { Metadata } from "next";
import { LegalMarkdownPage } from "@/components/legal/legal-markdown-page";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Terms of use for Modempic online services.",
  alternates: { canonical: "/terms-of-service" },
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
    />
  );
}
