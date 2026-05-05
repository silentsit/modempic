import type { Metadata } from "next";
import { ContactForm } from "./ui";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach Modempic support and team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Contact</h1>
      <p className="mt-2 text-[var(--muted-foreground)]">
        Email:{" "}
        <a href="mailto:info@modempic.com" className="text-[var(--primary)] hover:underline">
          info@modempic.com
        </a>
      </p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">We reply by email. No medical advice by message.</p>
      <div className="mt-8 max-w-lg">
        <ContactForm />
      </div>

      <RelatedLinks
        heading="Before you write to us"
        links={[
          { href: "/faq", label: "FAQ", description: "Common questions answered." },
          { href: "/shipping", label: "Shipping & handling", description: "Timelines, tracking, and customs." },
          { href: "/refund-policy", label: "Return & refund policy", description: "Eligibility and process." },
          { href: "/shop", label: "Shop", description: "Browse all products." },
        ]}
      />
    </Container>
  );
}
