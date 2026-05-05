import { prisma } from "@/lib/db";
import { deleteBlogPostAction, upsertBlogPostAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Blog</h1>
      <div className="mt-4 space-y-4">
        {posts.map((p) => (
          <form key={p.id} action={upsertBlogPostAction} className="rounded-lg border border-[var(--border)] p-4">
            <input type="hidden" name="id" value={p.id} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link href={`/blog/${p.slug}`} className="text-[var(--primary)] hover:underline" target="_blank" rel="noreferrer">
                  {p.title}
                </Link>
                <p className="text-xs text-[var(--muted-foreground)]">{p.status}</p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="secondary">
                  Save
                </Button>
                <Button formAction={deleteBlogPostAction} type="submit" size="sm" variant="destructive">
                  Delete
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Input name="title" defaultValue={p.title} aria-label="Title" required />
              <Input name="slug" defaultValue={p.slug} aria-label="Slug" required />
              <Input name="excerpt" defaultValue={p.excerpt ?? ""} aria-label="Excerpt" placeholder="Excerpt" />
              <Input name="category" defaultValue={p.category ?? ""} aria-label="Category" placeholder="Category" />
              <Input name="heroImageUrl" defaultValue={p.heroImageUrl ?? ""} aria-label="Hero image URL" placeholder="Hero image URL" />
              <Input name="readMinutes" type="number" defaultValue={p.readMinutes ?? undefined} aria-label="Read minutes" placeholder="Read minutes" />
              <Input name="seoTitle" defaultValue={p.seoTitle ?? ""} aria-label="SEO title" placeholder="SEO title" />
              <Input name="seoDesc" defaultValue={p.seoDesc ?? ""} aria-label="SEO description" placeholder="SEO description" />
            </div>
            <Textarea name="mdx" defaultValue={p.mdx} rows={8} className="mt-2 font-mono text-sm" aria-label="MDX" required />
            <select name="status" className="mt-2 w-full rounded border px-2 py-1" defaultValue={p.status}>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          </form>
        ))}
      </div>
      <h2 className="mt-8 text-lg font-semibold">New post (MDX body)</h2>
      <form action={upsertBlogPostAction} className="mt-2 max-w-2xl space-y-2">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="excerpt">Excerpt</Label>
          <Input id="excerpt" name="excerpt" className="mt-1" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="readMinutes">Read minutes</Label>
            <Input id="readMinutes" name="readMinutes" type="number" className="mt-1" />
          </div>
        </div>
        <div>
          <Label htmlFor="heroImageUrl">Hero image URL</Label>
          <Input id="heroImageUrl" name="heroImageUrl" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="mdx">MDX (markdown + components whitelisted in renderer)</Label>
          <Textarea id="mdx" name="mdx" required rows={12} className="mt-1 font-mono text-sm" />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" className="mt-1 w-full rounded border px-2 py-1">
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
        </div>
        <div>
          <Label htmlFor="seoTitle">SEO title</Label>
          <Input id="seoTitle" name="seoTitle" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="seoDesc">SEO description</Label>
          <Input id="seoDesc" name="seoDesc" className="mt-1" />
        </div>
        <Button type="submit">Publish / save</Button>
      </form>
    </div>
  );
}
