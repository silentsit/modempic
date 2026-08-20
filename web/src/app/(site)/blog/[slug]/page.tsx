import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPostBySlug, getPublishedPostSlugs, getPublishedPosts } from "@/lib/data/blog";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { BLOG_RELATED_PLACEHOLDER_IMAGE, SHOP_CATALOG_RELATED_LINKS } from "@/lib/related-catalog-links";
import { getSiteUrl } from "@/lib/site-url";
import { format } from "date-fns";

/**
 * TODO(cursor): when posts move to Sanity, replace <MDXRemote source={post.mdx}>
 * with <RichTextRenderer body={post.body} /> — the Article interface in types.ts
 * already carries PortableTextBlock[]. The mdxComponents map below then retires.
 */
const mdxComponents = {
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-10 scroll-mt-24 text-2xl font-semibold tracking-tight text-foreground" {...props} />
  ),
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mt-8 text-xl font-semibold tracking-tight text-foreground" {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<"p">) => (
    <p className="mt-5 leading-[1.8] text-muted-foreground" {...props} />
  ),
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-5 list-disc space-y-2 pl-5 text-muted-foreground marker:text-primary" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<"li">) => <li className="leading-relaxed" {...props} />,
  blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="my-8 border-l-2 border-accent pl-5 text-base italic leading-relaxed text-muted-foreground"
      {...props}
    />
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
  if (!p) return { title: "Article" };
  const title = p.seoTitle ?? p.title;
  const description = p.seoDesc ?? p.excerpt ?? undefined;
  const images = p.heroImageUrl ? [{ url: p.heroImageUrl, alt: p.title }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title,
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
      title,
      description,
      images: p.heroImageUrl ? [p.heroImageUrl] : undefined,
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
    headline: post.title,
    description: post.seoDesc ?? post.excerpt ?? undefined,
    image: post.heroImageUrl ? [`${root}${post.heroImageUrl}`] : undefined,
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
            {post.title}
          </h1>
          {post.publishedAt ? (
            <p className="mt-4 text-sm text-muted-foreground">
              <time dateTime={post.publishedAt.toISOString()}>{format(post.publishedAt, "MMMM d, yyyy")}</time>
              {post.author.name ? ` · ${post.author.name}` : null}
            </p>
          ) : null}
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
        <div className="mt-10">
          <MDXRemote source={post.mdx} components={mdxComponents} />
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
