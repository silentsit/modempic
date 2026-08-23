import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Container } from "@/components/site/container";
import { pageSocialMetadata } from "@/lib/seo/page-metadata";
import { getHtmlSitemapData, type HtmlSitemapLink } from "@/lib/seo/html-sitemap";
import { titleCaseHeading } from "@/lib/text/heading-title-case";

export const revalidate = 3600;

const SITEMAP_DESCRIPTION =
  "HTML sitemap of Modempic: shop pages, product categories, catalog listings, blog posts, and policy pages. Search engines should use the XML sitemap index.";

export const metadata: Metadata = {
  title: "Sitemap",
  description: SITEMAP_DESCRIPTION,
  alternates: { canonical: "/sitemap" },
  ...pageSocialMetadata({ title: "Sitemap", description: SITEMAP_DESCRIPTION, path: "/sitemap" }),
};

function SitemapList({ links }: { links: HtmlSitemapLink[] }) {
  return (
    <ul className="columns-1 gap-x-10 sm:columns-2 lg:columns-3 [column-fill:_balance]">
      {links.map((link) => (
        <li key={link.href} className="mb-2 break-inside-avoid">
          <Link href={link.href} className="text-accent underline-offset-2 transition-colors hover:underline">
            {titleCaseHeading(link.label)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function HtmlSitemapPage() {
  const sitemap = await getHtmlSitemapData();

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Sitemap" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Sitemap</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
        Every public page on Modempic, grouped the way the catalog is organized. Search engines should use the{" "}
        <Link href="/sitemap.xml" className="text-accent underline-offset-2 hover:underline">
          XML sitemap index
        </Link>
        . This page updates automatically when products, categories, or blog posts are published.
      </p>

      <section className="mt-12 space-y-4" aria-labelledby="sitemap-pages-heading">
        <h2 id="sitemap-pages-heading" className="text-2xl font-semibold tracking-tight text-foreground">
          Pages
        </h2>
        <SitemapList links={sitemap.pages} />
      </section>

      <section className="mt-12 space-y-4" aria-labelledby="sitemap-categories-heading">
        <h2 id="sitemap-categories-heading" className="text-2xl font-semibold tracking-tight text-foreground">
          Categories
        </h2>
        <SitemapList links={sitemap.categories} />
      </section>

      {sitemap.productGroups.length > 0 ? (
        <section className="mt-12 space-y-8" aria-labelledby="sitemap-products-heading">
          <h2 id="sitemap-products-heading" className="text-2xl font-semibold tracking-tight text-foreground">
            Products by Category
          </h2>
          {sitemap.productGroups.map((group) => (
            <div key={group.href + group.name}>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                <Link href={group.href} className="text-accent underline-offset-2 hover:underline">
                  {titleCaseHeading(group.name)}
                </Link>
              </h3>
              <div className="mt-4">
                <SitemapList links={group.products} />
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section className="mt-12 space-y-4" aria-labelledby="sitemap-blog-heading">
        <h2 id="sitemap-blog-heading" className="text-2xl font-semibold tracking-tight text-foreground">
          Blog
        </h2>
        <SitemapList
          links={[{ href: "/blog", label: "All articles" }, ...sitemap.posts]}
        />
      </section>
    </Container>
  );
}
