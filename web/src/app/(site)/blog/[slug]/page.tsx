import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPostBySlug, getPublishedPosts } from "@/lib/data/blog";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { RelatedLinks } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { BLOG_RELATED_PLACEHOLDER_IMAGE, SHOP_CATALOG_RELATED_LINKS } from "@/lib/related-catalog-links";
import { getSiteUrl } from "@/lib/site-url";
import { format } from "date-fns";

const mdxComponents = {
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => <h2 className="mt-8 text-2xl font-semibold" {...props} />,
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => <h3 className="mt-6 text-xl font-semibold" {...props} />,
  p: (props: React.ComponentPropsWithoutRef<"p">) => <p className="mt-3 leading-relaxed text-[var(--muted-foreground)]" {...props} />,
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => <strong className="font-semibold text-[var(--foreground)]" {...props} />,
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => <ul className="mt-3 list-inside list-disc space-y-2" {...props} />,
  li: (props: React.ComponentPropsWithoutRef<"li">) => <li className="text-[var(--muted-foreground)]" {...props} />,
  blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="my-6 border-l-4 border-emerald-600/35 pl-4 text-sm italic text-[var(--muted-foreground)]"
      {...props}
    />
  ),
  img: (props: React.ComponentPropsWithoutRef<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element -- MDX body uses stored paths under /blog-media
    <img className="my-6 h-auto max-w-full rounded-lg border border-[var(--border)] shadow-sm" {...props} alt={props.alt ?? ""} />
  ),
  a: (props: React.ComponentPropsWithoutRef<"a">) => (
    <a className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400" {...props} />
  ),
} as const;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPostBySlug(slug);
  if (!p) return { title: "Article" };
  return {
    title: p.seoTitle ?? p.title,
    description: p.seoDesc ?? p.excerpt ?? undefined,
    alternates: { canonical: `/blog/${slug}` },
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
    .slice(0, 4);

  return (
    <Container className="py-10 sm:py-14">
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
      <article className="prose-custom mx-auto mt-3 max-w-3xl">
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        {post.publishedAt ? (
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {format(post.publishedAt, "MMMM d, yyyy")} {post.author.name ? `· ${post.author.name}` : null}
            {post.category ? (
              <>
                {" · "}
                <Link
                  href={`/blog?cat=${encodeURIComponent(post.category)}`}
                  className="text-[var(--primary)] hover:underline"
                >
                  {post.category}
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">Educational content; not a substitute for professional care.</p>
        {post.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.heroImageUrl}
            alt=""
            className="mt-8 w-full max-h-[420px] rounded-xl border border-[var(--border)] object-cover shadow-sm"
            width={1200}
            height={630}
          />
        ) : null}
        <div className="mt-8">
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
