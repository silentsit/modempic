import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/data/blog";
import { BlogCategoryNav } from "@/components/blog/blog-category-nav";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Container } from "@/components/site/container";
import { DEFAULT_SHARE_IMAGE } from "@/lib/seo/page-metadata";

export const revalidate = 3600;

const BLOG_DESCRIPTION = "Catalog notes, shipping and payment guidance, and Modempic updates.";

type Props = {
  searchParams: Promise<{ cat?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { cat } = await searchParams;
  const hasFilter = Boolean(cat?.trim());
  return {
    title: "Blog",
    description: BLOG_DESCRIPTION,
    alternates: { canonical: "/blog" },
    robots: hasFilter ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: "Blog | Modempic",
      description: BLOG_DESCRIPTION,
      url: "/blog",
      type: "website",
      images: [DEFAULT_SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: "Blog | Modempic",
      description: BLOG_DESCRIPTION,
      images: [DEFAULT_SHARE_IMAGE.url],
    },
  };
}

export default async function BlogIndexPage({ searchParams }: Props) {
  const { cat } = await searchParams;
  const activeCategory = cat?.trim() ? decodeURIComponent(cat.trim()) : undefined;

  const posts = await getPublishedPosts();
  const categories = [...new Set(posts.map((p) => p.category).filter((c): c is string => Boolean(c)))].sort(
    (a, b) => a.localeCompare(b),
  );

  const validCategory =
    activeCategory && categories.includes(activeCategory) ? activeCategory : undefined;

  const filtered = validCategory ? posts.filter((p) => p.category === validCategory) : posts;

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs crumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      <header className="mt-3 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
        <p className="mx-auto mt-2 max-w-2xl text-[var(--muted-foreground)] sm:mx-0">
          Catalog notes and ordering guidance. Browse the{" "}
          <Link href="/shop" className="underline-offset-2 hover:underline">shop</Link>,{" "}
          <Link href="/shop/nootropics" className="underline-offset-2 hover:underline">Nootropics category</Link>, or read{" "}
          <Link href="/about" className="underline-offset-2 hover:underline">about Modempic</Link>.
        </p>
      </header>

      <BlogCategoryNav categories={categories} activeCategory={validCategory} />

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-[var(--muted-foreground)]">No articles in this category yet.</p>
      ) : (
        <ul className="mt-10 grid list-none gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => (
            <li key={p.id} className="list-none">
              <BlogPostCard post={p} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
