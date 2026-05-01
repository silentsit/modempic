import type { Metadata } from "next";
import { LegalMarkdownPage } from "@/components/legal/legal-markdown-page";

export const metadata: Metadata = {
  title: "Shipping & handling",
  description: "Shipping timelines, tracking, customs, and FAQs for Modempic orders.",
};

export default function ShippingPage() {
  return <LegalMarkdownPage file="shipping.md" />;
}
