import type { Metadata } from "next";
import { LegalMarkdownPage } from "@/components/legal/legal-markdown-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Modempic collects, uses, and protects your information.",
  alternates: { canonical: "/privacy-policy" },
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
    />
  );
}
