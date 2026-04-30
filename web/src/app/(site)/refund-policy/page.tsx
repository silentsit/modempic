import type { Metadata } from "next";
import { LegalMarkdownPage } from "@/components/legal/legal-markdown-page";

export const metadata: Metadata = {
  title: "Return policy",
};

/** Same body as `/refunds` — footer links here for backwards compatibility. */
export default function RefundPolicyPage() {
  return <LegalMarkdownPage file="return-policy.md" />;
}
