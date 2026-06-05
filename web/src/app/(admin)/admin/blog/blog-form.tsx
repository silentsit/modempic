import Link from "next/link";
import type { BlogPost } from "@prisma/client";
import { deleteBlogPostAction, upsertBlogPostAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BlogFormPost = Pick<
  BlogPost,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "mdx"
  | "status"
  | "category"
  | "heroImageUrl"
  | "readMinutes"
  | "seoTitle"
  | "seoDesc"
>;

export function BlogPostForm({
  post,
  cancelHref = "/admin/blog",
}: {
  post?: BlogFormPost;
  cancelHref?: string;
}) {
  const isEdit = Boolean(post?.id);

  return (
    <form action={upsertBlogPostAction} className="max-w-4xl space-y-4">
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit">{isEdit ? "Save changes" : "Create post"}</Button>
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        {isEdit && post ? (
          <>
            <Button type="button" variant="outline" asChild>
              <Link href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                Preview on site
              </Link>
            </Button>
            <Button formAction={deleteBlogPostAction} type="submit" variant="destructive" className="ml-auto">
              Delete
            </Button>
          </>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required defaultValue={post?.title ?? ""} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" required defaultValue={post?.slug ?? ""} className="mt-1 font-mono text-sm" />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Published posts require a lowercase hyphenated slug for canonical URLs.
          </p>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            defaultValue={post?.status ?? "DRAFT"}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Input id="excerpt" name="excerpt" defaultValue={post?.excerpt ?? ""} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" defaultValue={post?.category ?? ""} className="mt-1" placeholder="e.g. Modafinil" />
        </div>
        <div>
          <Label htmlFor="readMinutes">Read minutes</Label>
          <Input
            id="readMinutes"
            name="readMinutes"
            type="number"
            min={1}
            defaultValue={post?.readMinutes ?? undefined}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="heroImageUrl">Hero image URL</Label>
          <Input
            id="heroImageUrl"
            name="heroImageUrl"
            defaultValue={post?.heroImageUrl ?? ""}
            className="mt-1 font-mono text-sm"
            placeholder="/blog-media/..."
          />
        </div>
        <div>
          <Label htmlFor="seoTitle">SEO title</Label>
          <Input id="seoTitle" name="seoTitle" defaultValue={post?.seoTitle ?? ""} className="mt-1" />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Required before publishing.</p>
        </div>
        <div>
          <Label htmlFor="seoDesc">SEO description</Label>
          <Input id="seoDesc" name="seoDesc" defaultValue={post?.seoDesc ?? ""} className="mt-1" />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Required before publishing.</p>
        </div>
      </div>

      <div>
        <Label htmlFor="mdx">MDX body</Label>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
          Markdown with whitelisted components in the storefront renderer.
        </p>
        <Textarea
          id="mdx"
          name="mdx"
          required
          rows={24}
          defaultValue={post?.mdx ?? ""}
          className="mt-2 font-mono text-sm leading-relaxed"
          spellCheck={false}
        />
      </div>
    </form>
  );
}
