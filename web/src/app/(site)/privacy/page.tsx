import type { Metadata } from "next";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "Privacy policy",
};

export default function PrivacyPage() {
  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy policy</h1>
      <div className="prose-custom mt-8 max-w-2xl space-y-4 text-sm text-[var(--muted-foreground)]">
        <p>
          <strong className="text-[var(--foreground)]">Data we collect.</strong> We collect account and order data you
          provide (name, email, shipping address), payment status from processors (not your full card or wallet keys for
          crypto, unless a partner requires a stored token for that flow), and technical logs to secure the service.
        </p>
        <p>
          <strong className="text-[var(--foreground)]">How we use data.</strong> To fulfill orders, send transactional
          email, improve fraud protection, and comply with law. We do not sell your personal data.
        </p>
        <p>
          <strong className="text-[var(--foreground)]">Your choices.</strong> You may request access or deletion of
          personal data where applicable by contacting support@modempic.com. Marketing emails, if we send any, will
          include an unsubscribe path.
        </p>
        <p>
          <strong className="text-[var(--foreground)]">Children.</strong> This store is not directed to children under 13
          (or the age your jurisdiction requires).
        </p>
        <p className="text-xs">This policy is a template for development. Have counsel review before production use.</p>
      </div>
    </Container>
  );
}
