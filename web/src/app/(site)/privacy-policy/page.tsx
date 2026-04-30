import type { Metadata } from "next";
import { LegalMarkdownPage } from "@/components/legal/legal-markdown-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Modempic collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return <LegalMarkdownPage file="privacy-policy.md" />;
}
