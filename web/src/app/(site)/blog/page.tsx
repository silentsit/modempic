import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/data/blog";
import { Container } from "@/components/site/container";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Wellness blog",
  description: "Education on supplement labels, routines, and everyday wellness—without medical claims.",
};

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">Education and habits—not medical advice.</p>
      <ul className="mt-10 space-y-8">
        {posts.map((p) => (
          <li key={p.id} className="border-b border-[var(--border)] pb-8">
            <Link href={`/blog/${p.slug}`} className="group block">
              <h2 className="text-xl font-semibold group-hover:underline sm:text-2xl">{p.title}</h2>
              {p.publishedAt ? (
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{format(p.publishedAt, "MMMM d, yyyy")}</p>
              ) : null}
              {p.excerpt ? <p className="mt-3 text-[var(--muted-foreground)]">{p.excerpt}</p> : null}
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
