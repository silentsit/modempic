import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "./ui";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";

import { pageSocialMetadata } from "@/lib/seo/page-metadata";

const CONTACT_DESCRIPTION =
  "Contact Modempic support by email for order, shipping, and payment questions. We reply by email.";

export const metadata: Metadata = {
  title: "Contact",
  description: CONTACT_DESCRIPTION,
  alternates: { canonical: "/contact" },
  ...pageSocialMetadata({ title: "Contact", description: CONTACT_DESCRIPTION, path: "/contact" }),
};

const bodyLinkClassName =
  "font-medium text-accent underline-offset-2 transition-colors hover:text-accent-hover hover:underline";

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

      <div className="mt-6 max-w-lg rounded-xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">
        <p>
          Tracking number in hand? Use{" "}
          <Link href="/shipping" className={bodyLinkClassName}>
            shipping &amp; tracking
          </Link>{" "}
          first — Post Track and 17 Track cover most parcels. Include the order number here if the number still does not
          move.
        </p>
      </div>

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
