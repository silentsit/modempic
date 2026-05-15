import Link from "next/link";
import { BlogPostForm } from "../blog-form";
import { BlogAdminNotice } from "../blog-notice";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getNotice(params: Awaited<SearchParams>) {
  const value = params.notice;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function AdminBlogNewPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const notice = getNotice(params);

  return (
    <div className="space-y-4">
      <BlogAdminNotice notice={notice} />
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Link href="/admin/blog" className="text-[#2271b1] hover:underline">
          Posts
        </Link>
        <span aria-hidden>/</span>
        <span className="text-[var(--foreground)]">Add new</span>
      </div>
      <h1 className="text-2xl font-bold">Add new post</h1>
      <BlogPostForm />
    </div>
  );
}
