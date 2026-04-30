import Link from "next/link";
import { format } from "date-fns";
import type { BlogPost } from "@prisma/client";

export type BlogPostCardModel = BlogPost & { author: { name: string | null } };

export function BlogPostCard({ post }: { post: BlogPostCardModel }) {
  const metaParts = [
    post.category,
    post.author.name ?? undefined,
    post.readMinutes ? `${post.readMinutes} min read` : undefined,
  ].filter(Boolean);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-[var(--muted)]">
        {post.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blog imports under /public
          <img
            src={post.heroImageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
            width={640}
            height={400}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--muted-foreground)]">
            Article
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {metaParts.length > 0 ? (
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            {metaParts.join(" · ")}
          </p>
        ) : null}
        <h2 className="mt-2 text-lg font-bold leading-snug text-[var(--foreground)] sm:text-xl">
          <Link href={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--muted-foreground)]">{post.excerpt}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-4 text-sm">
          {post.publishedAt ? (
            <time dateTime={post.publishedAt.toISOString()} className="text-[var(--muted-foreground)]">
              {format(post.publishedAt, "MMM d, yyyy")}
            </time>
          ) : (
            <span />
          )}
          <Link
            href={`/blog/${post.slug}`}
            className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Read more »
          </Link>
        </div>
      </div>
    </article>
  );
}
