import type { Metadata } from "next";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "Terms of service",
};

export default function TermsPage() {
  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of service</h1>
      <div className="prose-custom mt-8 max-w-2xl space-y-4 text-sm text-[var(--muted-foreground)]">
        <p>
          By using Modempic you agree to these terms. We sell wellness products only; nothing on this site is a
          prescription, diagnosis, or treatment. Consult a health professional for medical decisions.
        </p>
        <p>
          <strong className="text-[var(--foreground)]">Payments.</strong> You authorize us and our partners to
          process payment in USD. For crypto, you are responsible for correct addresses and network selection. For
          on-ramp flows, the partner&rsquo;s terms apply. Verification and limits follow provider and legal rules.
        </p>
        <p>
          <strong className="text-[var(--foreground)]">Limitation of liability.</strong> To the maximum extent
          permitted by law, Modempic is not liable for indirect or consequential damages arising from use of the site
          or products. Some jurisdictions do not allow certain limitations; in those cases our liability is limited
          to the amount you paid for the order giving rise to the claim.
        </p>
        <p className="text-xs">Template for development—have legal counsel review before production.</p>
      </div>
    </Container>
  );
}
