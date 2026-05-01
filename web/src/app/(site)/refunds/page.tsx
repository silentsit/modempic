import type { Metadata } from "next";
import { LegalMarkdownPage } from "@/components/legal/legal-markdown-page";

export const metadata: Metadata = {
  title: "Return & refund policy",
};

export default function RefundsPage() {
  return <LegalMarkdownPage file="return-policy.md" />;
}
