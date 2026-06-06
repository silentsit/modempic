import Link from "next/link";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { getFeaturedBlogPosts } from "@/lib/data/blog";
import { cn } from "@/lib/utils";

export async function FeaturedBlogPosts({
  heading = "From the Modempic blog",
  className,
}: {
  heading?: string;
  className?: string;
}) {
  const posts = await getFeaturedBlogPosts(4);
  if (posts.length === 0) return null;

  return (
    <section
      className={cn("mt-12 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-6", className)}
      aria-labelledby="featured-blog-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="featured-blog-heading" className="text-base font-semibold text-[var(--foreground)]">
          {heading}
        </h2>
        <Link href="/blog" className="text-sm font-medium text-[var(--primary)] underline-offset-2 hover:underline">
          View all articles
        </Link>
      </div>
      <ul className="mt-4 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <li key={post.id} className="list-none">
            <BlogPostCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}
