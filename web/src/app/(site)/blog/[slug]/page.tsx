import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPostBySlug, getPublishedPostSlugs, getPublishedPosts } from "@/lib/data/blog";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { BLOG_RELATED_PLACEHOLDER_IMAGE, SHOP_CATALOG_RELATED_LINKS } from "@/lib/related-catalog-links";
import { formatFaqAnswersOnOwnLine } from "@/lib/blog/format-faq-mdx";
import { titleCaseHeading } from "@/lib/text/heading-title-case";
import { titleCaseHeadingChildren } from "@/lib/text/heading-title-case-node";
import { getSiteUrl } from "@/lib/site-url";
import { pageDocumentTitle, pageShareTitle, DEFAULT_SHARE_IMAGE, MISSING_ENTITY_METADATA } from "@/lib/seo/page-metadata";
import { toAbsoluteUrl } from "@/lib/seo/sitemap-xml";
import { format } from "date-fns";
import { Children, isValidElement, type ReactNode } from "react";

/**
 * TODO(cursor): when posts move to Sanity, replace <MDXRemote source={post.mdx}>
 * with <RichTextRenderer body={post.body} /> — the Article interface in types.ts
 * already carries PortableTextBlock[]. The mdxComponents map below then retires.
 */

function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node) && node.props.children != null) {
    return nodeText(node.props.children);
  }
  return "";
}

function MdxStrong(props: React.ComponentPropsWithoutRef<"strong">) {
  return <strong className="font-semibold text-foreground" {...props} />;
}

function isStrongElement(node: ReactNode): node is React.ReactElement<{ children?: ReactNode }> {
  return isValidElement(node) && (node.type === "strong" || node.type === MdxStrong);
}

/** Bold question + leftover siblings, or a single "Question? Answer" string. */
function splitQuestionAnswer(children: ReactNode): { question: ReactNode; answer: ReactNode } | null {
  const items = Children.toArray(children).filter((item) => !(typeof item === "string" && !item.trim()));
  const first = items[0];
  if (isStrongElement(first)) {
    const question = nodeText(first.props.children).trim();
    if (/\?$/.test(question) && items.length > 1) {
      return { question: first, answer: items.slice(1) };
    }
  }
  if (items.length === 1 && typeof items[0] === "string") {
    const match = items[0].match(/^(.{8,180}\?)[ \t]+(\S[\s\S]*)$/);
    if (match) return { question: match[1], answer: match[2] };
  }
  return null;
}

function headingSlug(children: ReactNode): string {
  return nodeText(children)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const mdxComponents = {
  h1: ({ children, ...props }: React.ComponentPropsWithoutRef<"h1">) => (
    <h2 className="mt-10 scroll-mt-24 text-2xl font-semibold tracking-tight text-foreground" {...props}>
      {titleCaseHeadingChildren(children)}
    </h2>
  ),
  h2: ({ children, id, ...props }: React.ComponentPropsWithoutRef<"h2">) => (
    <h2
      id={id ?? headingSlug(children)}
      className="mt-10 scroll-mt-24 text-2xl font-semibold tracking-tight text-foreground"
      {...props}
    >
      {titleCaseHeadingChildren(children)}
    </h2>
  ),
  h3: ({ children, id, ...props }: React.ComponentPropsWithoutRef<"h3">) => (
    <h3
      id={id ?? headingSlug(children)}
      className="mt-8 scroll-mt-24 text-xl font-semibold tracking-tight text-foreground"
      {...props}
    >
      {titleCaseHeadingChildren(children)}
    </h3>
  ),
  h4: ({ children, ...props }: React.ComponentPropsWithoutRef<"h4">) => (
    <h4 className="mt-6 text-base font-semibold tracking-tight text-foreground" {...props}>
      {titleCaseHeadingChildren(children)}
    </h4>
  ),
  p: (props: React.ComponentPropsWithoutRef<"p">) => {
    const split = splitQuestionAnswer(props.children);
    if (split) {
      return (
        <p className="mt-5 leading-[1.8] text-muted-foreground">
          <span className="mb-1 block font-semibold text-foreground">
            {typeof split.question === "string" ? titleCaseHeading(split.question) : titleCaseHeadingChildren(split.question)}
          </span>
          {split.answer}
        </p>
      );
    }
    return <p className="mt-5 leading-[1.8] text-muted-foreground" {...props} />;
  },
  strong: MdxStrong,
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-5 list-disc space-y-2 pl-5 text-muted-foreground marker:text-primary" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="mt-5 list-decimal space-y-4 pl-5 text-muted-foreground marker:text-primary" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<"li">) => {
    const split = splitQuestionAnswer(props.children);
    if (split) {
      return (
        <li className="leading-relaxed">
          <span className="mb-1 block font-semibold text-foreground">
            {typeof split.question === "string" ? titleCaseHeading(split.question) : titleCaseHeadingChildren(split.question)}
          </span>
          <span className="block">{split.answer}</span>
        </li>
      );
    }
    return <li className="leading-relaxed" {...props} />;
  },
  blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="my-8 border-l-2 border-accent pl-5 text-base italic leading-relaxed text-muted-foreground"
      {...props}
    />
  ),
  table: (props: React.ComponentPropsWithoutRef<"table">) => (
    <div className="blog-table-scroll" role="region" aria-label="Scrollable table" tabIndex={0}>
      <table {...props} />
    </div>
  ),
  img: (props: React.ComponentPropsWithoutRef<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element -- MDX body uses stored paths under /blog-media
    <img className="my-10 h-auto max-w-full rounded-2xl border border-border" {...props} alt={props.alt ?? ""} />
  ),
  a: (props: React.ComponentPropsWithoutRef<"a">) => (
    <a
      className="font-medium text-accent underline underline-offset-2 transition-colors hover:text-accent-hover"
      {...props}
    />
  ),
} as const;

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPublishedPostSlugs();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPostBySlug(slug);
  if (!p) return { title: "Article", ...MISSING_ENTITY_METADATA };
  const title = pageDocumentTitle(p.seoTitle ?? p.title);
  const shareTitle = pageShareTitle(p.seoTitle ?? p.title);
  const description = p.seoDesc ?? p.excerpt ?? `Read ${p.title} on the Modempic blog.`;
  const images = p.heroImageUrl
    ? [{ url: toAbsoluteUrl(p.heroImageUrl, getSiteUrl().replace(/\/$/, "")), alt: p.title }]
    : [DEFAULT_SHARE_IMAGE];
  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: shareTitle,
      description,
      url: `/blog/${slug}`,
      siteName: "Modempic",
      images,
      publishedTime: p.publishedAt?.toISOString(),
      modifiedTime: p.updatedAt.toISOString(),
      authors: p.author.name ? [p.author.name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: p.heroImageUrl
        ? [toAbsoluteUrl(p.heroImageUrl, getSiteUrl().replace(/\/$/, ""))]
        : [DEFAULT_SHARE_IMAGE.url],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([getPostBySlug(slug), getPublishedPosts()]);
  if (!post) notFound();

  const root = getSiteUrl().replace(/\/$/, "");
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": `${root}/blog/${post.slug}` },
    headline: titleCaseHeading(post.title),
    description: post.seoDesc ?? post.excerpt ?? undefined,
    image: post.heroImageUrl ? [toAbsoluteUrl(post.heroImageUrl, root)] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: post.author.name ? { "@type": "Person", name: post.author.name } : undefined,
    publisher: { "@type": "Organization", name: "Modempic", logo: { "@type": "ImageObject", url: `${root}/modempic-logo.png` } },
  };

  const related = allPosts
    .filter((p) => p.slug !== post.slug && (post.category ? p.category === post.category : true))
    .slice(0, 3);

  return (
    <Container className="py-10 sm:py-16">
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          ...(post.category
            ? [{ label: post.category, href: `/blog?cat=${encodeURIComponent(post.category)}` }]
            : []),
          { label: post.title },
        ]}
      />

      <article className="mx-auto mt-10 max-w-2xl">
        {/* Article header */}
        <header>
          {post.category ? (
            <Link
              href={`/blog?cat=${encodeURIComponent(post.category)}`}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary-hover"
            >
              {post.category}
            </Link>
          ) : null}
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl sm:leading-[1.15]">
            {titleCaseHeading(post.title)}
          </h1>
          {post.publishedAt ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Published{" "}
              <time dateTime={post.publishedAt.toISOString()}>{format(post.publishedAt, "MMMM d, yyyy")}</time>
              {" · Updated "}
              <time dateTime={post.updatedAt.toISOString()}>{format(post.updatedAt, "MMMM d, yyyy")}</time>
              {post.author.name ? ` · ${post.author.name}` : null}
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Updated{" "}
              <time dateTime={post.updatedAt.toISOString()}>{format(post.updatedAt, "MMMM d, yyyy")}</time>
              {post.author.name ? ` · ${post.author.name}` : null}
            </p>
          )}
          <p className="mt-6 rounded-2xl border border-border bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            Educational catalog content; not medical, clinical, or personal-use guidance.
          </p>
        </header>

        {post.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.heroImageUrl}
            alt={post.title}
            className="mt-10 w-full max-h-[420px] rounded-2xl border border-border object-cover"
            width={1200}
            height={630}
          />
        ) : null}

        {/* Body — optimal line length via max-w-2xl + 1.8 leading */}
        <div className="blog-article-body mt-10">
          <MDXRemote source={formatFaqAnswersOnOwnLine(post.mdx)} components={mdxComponents} />
        </div>
      </article>

      {related.length > 0 ? (
        <RelatedLinks
          heading={post.category ? `More in ${post.category}` : "More from the blog"}
          links={related.map((p) => ({
            href: `/blog/${p.slug}`,
            label: p.title,
            description: p.excerpt ?? undefined,
            imageUrl: p.heroImageUrl ?? BLOG_RELATED_PLACEHOLDER_IMAGE,
            imageAlt: p.title,
          }))}
        />
      ) : null}

      <RelatedLinks heading="Shop our catalog" links={SHOP_CATALOG_RELATED_LINKS} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
    </Container>
  );
}
