import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPostBySlug } from "@/lib/data/blog";
import { Container } from "@/components/site/container";
import { format } from "date-fns";

const mdxComponents = {
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => <h2 className="mt-8 text-2xl font-semibold" {...props} />,
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => <h3 className="mt-6 text-xl font-semibold" {...props} />,
  p: (props: React.ComponentPropsWithoutRef<"p">) => <p className="mt-3 leading-relaxed text-[var(--muted-foreground)]" {...props} />,
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => <strong className="font-semibold text-[var(--foreground)]" {...props} />,
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => <ul className="mt-3 list-inside list-disc space-y-2" {...props} />,
  li: (props: React.ComponentPropsWithoutRef<"li">) => <li className="text-[var(--muted-foreground)]" {...props} />,
} as const;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPostBySlug(slug);
  if (!p) return { title: "Article" };
  return { title: p.seoTitle ?? p.title, description: p.seoDesc ?? p.excerpt ?? undefined };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <Container className="py-10 sm:py-14">
      <Link href="/blog" className="text-sm text-[var(--primary)] hover:underline">
        ← All articles
      </Link>
      <article className="prose-custom mx-auto max-w-2xl">
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        {post.publishedAt ? (
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {format(post.publishedAt, "MMMM d, yyyy")} {post.author.name ? `· ${post.author.name}` : null}
          </p>
        ) : null}
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">Educational content; not a substitute for professional care.</p>
        <div className="mt-8">
          <MDXRemote source={post.mdx} components={mdxComponents} />
        </div>
      </article>
    </Container>
  );
}
