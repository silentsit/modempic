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
      <article className="prose-custom mx-auto max-w-3xl">
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        {post.publishedAt ? (
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {format(post.publishedAt, "MMMM d, yyyy")} {post.author.name ? `· ${post.author.name}` : null}
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
    </Container>
  );
}
