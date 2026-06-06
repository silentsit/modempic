import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FeaturedBlogPosts } from "@/components/blog/featured-blog-posts";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "About Modempic",
  description: "Our mission: clear modafinil catalog records, transparent pricing, and reliable order support.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">About Modempic</h1>
      <div className="prose-custom mt-8 max-w-2xl space-y-4 text-[var(--muted-foreground)]">
        <p>
          We believe specialized ecommerce should be easy to review before checkout. Too many catalogs bury product
          details behind marketing language or hide true cost behind subscriptions you did not ask for.
        </p>
        <p>
          Modempic is built around clear product records, structured documentation, and checkout options that meet you
          where you are, including digital assets and card on-ramps from vetted partners.
          Browse the{" "}
          <Link href="/shop" className="text-[var(--primary)] hover:underline">full shop</Link>, see{" "}
          <Link href="/shop/best-sellers" className="text-[var(--primary)] hover:underline">best sellers</Link>, or read
          our <Link href="/blog" className="text-[var(--primary)] hover:underline">articles</Link>.
        </p>
        <p>
          Product pages are for catalog and ordering information only. Questions?{" "}
          <Link href="/contact" className="text-[var(--primary)] hover:underline">Contact us</Link> or read the{" "}
          <Link href="/faq" className="text-[var(--primary)] hover:underline">FAQ</Link>.
        </p>
      </div>

      <FeaturedBlogPosts />
    </Container>
  );
}
