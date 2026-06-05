import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getCategorySlugs, listCategories } from "@/lib/data/products";
import { ProductCard } from "@/components/shop/product-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { catalogCategoryImageUrl } from "@/lib/related-catalog-links";

type Props = { params: Promise<{ categorySlug: string }> };

export const revalidate = 3600;

type CategorySeoContent = {
  intro: string;
  support: string;
  faqs: Array<{ q: string; a: string }>;
};

const CATEGORY_SEO_CONTENT: Record<string, CategorySeoContent> = {
  modafinil: {
    intro:
      "Review Modafinil catalog records with USD pricing, product labels, and checkout details in one place. Product pages include ordering information and documentation notes where available.",
    support:
      "Use this category to compare strengths, package sizes, pricing, and product-page documentation before choosing an item. Modempic keeps payment guidance and order tracking close to checkout so the ordering flow is easier to review.",
    faqs: [
      {
        q: "What should I compare before ordering from this category?",
        a: "Compare product labels, package size, price, availability, shipping notes, and any documentation shown on the product page.",
      },
      {
        q: "Are category pages medical guidance?",
        a: "No. Category pages are catalog and ordering pages only. They are not medical, clinical, dosage, diagnosis, or personal-use guidance.",
      },
    ],
  },
  peptides: {
    intro:
      "Browse peptide catalog items with research-use notices, structured handling details, and product documentation where available.",
    support:
      "Peptide listings should be reviewed through their individual product records, including purity/testing status, COA links, storage notes, and shipping restrictions when those fields are provided.",
    faqs: [
      {
        q: "Are peptide products for human consumption?",
        a: "No. Products marked for research use are for laboratory/research purposes only and are not for human consumption, clinical use, diagnosis, treatment, or personal use.",
      },
      {
        q: "Where can I find testing or COA information?",
        a: "When available, testing status and COA links are shown on the product detail page in the research-use details section.",
      },
    ],
  },
  "skin-care": {
    intro:
      "Compare skin care catalog items by label details, pricing, and product-page documentation before checkout.",
    support:
      "Each listing links to a product record with description, images, price, and ordering details. Review the product page for any handling, label, or shipping notes before placing an order.",
    faqs: [
      {
        q: "What information is shown on each product page?",
        a: "Product pages show pricing, images, descriptions, labels or documentation where available, checkout options, and any category-specific notices.",
      },
      {
        q: "How are orders paid?",
        a: "Checkout uses crypto-first payment routing, with supported assets and provider guidance shown during checkout.",
      },
    ],
  },
  antiparasitic: {
    intro:
      "Review antiparasitic catalog items through product records that focus on labels, pricing, ordering details, and documentation notes.",
    support:
      "This category is maintained as catalog information only. Review each item page carefully and do not treat category descriptions as clinical, diagnostic, treatment, or dosage guidance.",
    faqs: [
      {
        q: "Does this category provide treatment advice?",
        a: "No. This page is catalog and ordering information only and does not provide treatment, dosage, diagnosis, or personal-use guidance.",
      },
      {
        q: "What should I review before checkout?",
        a: "Review the product label, description, research-use or category notices, price, shipping notes, and payment instructions.",
      },
    ],
  },
};

function categorySeoContent(slug: string, name: string): CategorySeoContent {
  return CATEGORY_SEO_CONTENT[slug] ?? {
    intro: `Browse ${name} catalog items with clear labels, USD pricing, and product-page documentation where available.`,
    support:
      "Use this category page as a starting point, then review each product detail page for label information, documentation notes, pricing, shipping context, and checkout guidance.",
    faqs: [
      {
        q: "What should I review before ordering?",
        a: "Review the product label, description, documentation notes, price, shipping context, and any research-use or category notices on the product page.",
      },
      {
        q: "Are these pages medical guidance?",
        a: "No. Modempic category and product pages are catalog and ordering pages only and are not medical, clinical, diagnosis, treatment, or dosage guidance.",
      },
    ],
  };
}

export async function generateStaticParams() {
  const categories = await getCategorySlugs();
  return categories.map((category) => ({ categorySlug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const cat = await getCategoryBySlug(categorySlug);
  if (!cat) return { title: "Category" };
  return {
    title: cat.seoTitle ?? `${cat.name} | Shop`,
    description: cat.seoDesc ?? cat.description ?? `Shop ${cat.name} at Modempic`,
    alternates: { canonical: `/shop/${categorySlug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const [cat, allCategories] = await Promise.all([getCategoryBySlug(categorySlug), listCategories()]);
  if (!cat) notFound();

  const products = cat.products
    .map((pc) => pc.product)
    .sort((a, b) => a.name.localeCompare(b.name));

  const otherCategories = allCategories.filter((c) => c.slug !== categorySlug);
  const seoContent = categorySeoContent(cat.slug, cat.name);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seoContent.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <Container className="py-10 sm:py-14">
        <Breadcrumbs
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: cat.name },
          ]}
        />
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{cat.name}</h1>
        <div className="mt-3 max-w-3xl space-y-3 text-[var(--muted-foreground)]">
          {cat.description ? <p>{cat.description}</p> : null}
          <p>{seoContent.intro}</p>
        </div>
        {products.length === 0 ? (
          <p className="mt-8 text-[var(--muted-foreground)]">No products in this category yet.</p>
        ) : (
          <ul className="mt-10 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.id} className="h-full list-none">
                <ProductCard product={p} buyNowHref={`/checkout?buy=${encodeURIComponent(p.slug)}`} />
              </li>
            ))}
          </ul>
        )}

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-[var(--hero)]">
            About {cat.name} catalog items
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">{seoContent.support}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2" aria-label={`${cat.name} category questions`}>
            {seoContent.faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{faq.q}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <RelatedLinks
          heading="Browse other categories"
          links={otherCategories.map((c) => ({
            href: `/shop/${c.slug}`,
            label: c.name,
            description: c.description ?? undefined,
            imageUrl: catalogCategoryImageUrl(c.slug),
            imageAlt: c.name,
          }))}
        />
      </Container>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
