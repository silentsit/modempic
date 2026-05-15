import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminBlogPostById } from "@/lib/data/blog";
import { BlogPostForm } from "../blog-form";
import { BlogAdminNotice } from "../blog-notice";

type Props = { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminBlogEditPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const notice = typeof sp.notice === "string" ? sp.notice : Array.isArray(sp.notice) ? sp.notice[0] : undefined;
  const post = await getAdminBlogPostById(id);
  if (!post) notFound();

  return (
    <div className="space-y-4">
      <BlogAdminNotice notice={notice} />

      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Link href="/admin/blog" className="text-[#2271b1] hover:underline">
          Posts
        </Link>
        <span aria-hidden>/</span>
        <span className="line-clamp-1 text-[var(--foreground)]">{post.title}</span>
      </div>
      <h1 className="text-2xl font-bold">Edit post</h1>
      <BlogPostForm post={post} />
    </div>
  );
}
