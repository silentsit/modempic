import Link from "next/link";
import { format } from "date-fns";
import type { BlogPost } from "@prisma/client";
import { getBlogPostCardDate } from "@/lib/blog/blog-post-date";
import { titleCaseHeading } from "@/lib/text/heading-title-case";

export type BlogPostCardModel = BlogPost & { author: { name: string | null } };

export function BlogPostCard({ post }: { post: BlogPostCardModel }) {
  const metaParts = [
    post.category,
    post.author.name ?? undefined,
    post.readMinutes ? `${post.readMinutes} min read` : undefined,
  ].filter(Boolean);
  const cardDate = getBlogPostCardDate(post);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-muted">
        {post.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blog imports under /public
          <img
            src={post.heroImageUrl}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
            width={640}
            height={400}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            Article
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {metaParts.length > 0 ? (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {metaParts.join(" · ")}
          </p>
        ) : null}
        <h2 className="mt-2 text-lg font-semibold leading-snug text-foreground sm:text-xl">
          <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-primary">
            {titleCaseHeading(post.title)}
          </Link>
        </h2>
        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-sm">
          <time dateTime={cardDate.date.toISOString()} className="text-muted-foreground">
            {cardDate.label} {format(cardDate.date, "MMM d, yyyy")}
          </time>
          <Link
            href={`/blog/${post.slug}`}
            className="font-medium text-accent transition-colors hover:text-accent-hover hover:underline"
          >
            Read more »
          </Link>
        </div>
      </div>
    </article>
  );
}
