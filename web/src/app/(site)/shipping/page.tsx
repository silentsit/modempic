import type { Metadata } from "next";
import { LegalMarkdownPage } from "@/components/legal/legal-markdown-page";

export const metadata: Metadata = {
  title: "Shipping & handling",
  description: "Shipping timelines, tracking, customs, and FAQs for Modempic orders.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <LegalMarkdownPage
      file="shipping.md"
      crumbs={[{ label: "Home", href: "/" }, { label: "Shipping" }]}
      related={[
        { href: "/refund-policy", label: "Return & refund policy", description: "Eligibility and process." },
        { href: "/faq", label: "FAQ", description: "Common questions about orders." },
        { href: "/contact", label: "Contact support", description: "Email reply within one business day." },
        { href: "/shop", label: "Shop", description: "Browse all products." },
      ]}
    />
  );
}
