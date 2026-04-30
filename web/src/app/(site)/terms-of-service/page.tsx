import type { Metadata } from "next";
import { LegalMarkdownPage } from "@/components/legal/legal-markdown-page";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Terms of use for Modempic online services.",
};

export default function TermsOfServicePage() {
  return <LegalMarkdownPage file="terms-of-service.md" />;
}
