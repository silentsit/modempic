import { prisma } from "@/lib/db";
import { createBlogPostAction } from "@/lib/actions/admin";
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
      <ul className="mt-3 space-y-1 text-sm">
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/blog/${p.slug}`} className="text-[var(--primary)] hover:underline" target="_blank" rel="noreferrer">
              {p.title}
            </Link>{" "}
            — {p.status}
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-lg font-semibold">New post (MDX body)</h2>
      <form action={createBlogPostAction} className="mt-2 max-w-2xl space-y-2">
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
        <Button type="submit">Publish / save</Button>
      </form>
    </div>
  );
}
