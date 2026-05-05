import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "About Modempic",
  description: "Our mission: accessible, affordable wellness products with honest labeling.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">About Modempic</h1>
      <div className="prose-custom mt-8 max-w-2xl space-y-4 text-[var(--muted-foreground)]">
        <p>
          We believe dietary supplements should be easy to understand and fairly priced. Too many brands bury the
          details behind marketing language or hide true cost behind subscriptions you did not ask for.
        </p>
        <p>
          Modempic is built around clear supplement facts, structure/function language that stays within regulations, and
          checkout options that meet you where you are—including digital assets and card on-ramps from vetted partners.
          Browse the{" "}
          <Link href="/shop" className="text-[var(--primary)] hover:underline">full shop</Link>, see{" "}
          <Link href="/shop/best-sellers" className="text-[var(--primary)] hover:underline">best sellers</Link>, or read
          our <Link href="/blog" className="text-[var(--primary)] hover:underline">articles</Link>.
        </p>
        <p>
          We are not a substitute for your doctor or pharmacist. We sell wellness products, not prescriptions, and we
          do not claim to treat diseases. If you have a medical condition or take medication, get professional advice
          before starting a new supplement. Questions? <Link href="/contact" className="text-[var(--primary)] hover:underline">Contact us</Link>{" "}
          or read the <Link href="/faq" className="text-[var(--primary)] hover:underline">FAQ</Link>.
        </p>
      </div>

      <RelatedLinks
        links={[
          { href: "/shop", label: "Shop all products", description: "Modafinil, vitamins, skin care, and more." },
          { href: "/blog", label: "Read the blog", description: "Education-only articles on wellness and cognition." },
          { href: "/shipping", label: "Shipping & handling", description: "Timelines, tracking, and customs." },
          { href: "/refund-policy", label: "Return & refund policy", description: "Eligibility and the return process." },
        ]}
      />
    </Container>
  );
}
