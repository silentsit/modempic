import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { FeaturedBlogPosts } from "@/components/blog/featured-blog-posts";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "About Modempic",
  description:
    "Modempic exists so hard-to-find medicines stay reachable — at the lowest prices online, because access should not depend on what you earn.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">About Modempic</h1>
      <div className="prose-custom mt-8 max-w-2xl space-y-4 text-[var(--muted-foreground)]">
        <p>
          We believe the price of staying well should not depend on where you live or what you earn. Modempic exists to
          close that gap — medicines that are difficult to purchase, at prices that do not make you choose.
        </p>
        <p>
          That is the point of the shop. Lowest prices among major online vendors, on purpose: access only counts if
          people can actually afford it. Browse the{" "}
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
