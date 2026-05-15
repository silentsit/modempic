import Link from "next/link";
import { ADMIN_BLOG_PAGE_SIZE, listAdminBlogCategories, listAdminBlogPosts } from "@/lib/data/blog";
import { BlogAdminNotice } from "./blog-notice";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(params: Awaited<SearchParams>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function seoWarnings(row: { excerpt: string | null; seoDesc: string | null }) {
  const warnings: string[] = [];
  if (!row.excerpt?.trim()) warnings.push("No excerpt");
  if (!row.seoDesc?.trim()) warnings.push("No SEO desc");
  return warnings;
}

export default async function AdminBlogPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const search = getParam(params, "s")?.trim();
  const status = getParam(params, "status")?.trim();
  const category = getParam(params, "category")?.trim();
  const pageRaw = getParam(params, "page");
  const page = Math.max(1, Math.floor(Number(pageRaw) || 1));
  const notice = getParam(params, "notice");

  const [{ rows, total, totalAll, totalPages }, categories] = await Promise.all([
    listAdminBlogPosts({ search, status, category, page }),
    listAdminBlogCategories(),
  ]);

  const from = total === 0 ? 0 : (page - 1) * ADMIN_BLOG_PAGE_SIZE + 1;
  const to = Math.min(page * ADMIN_BLOG_PAGE_SIZE, total);

  function pageHref(p: number) {
    const q = new URLSearchParams();
    if (search) q.set("s", search);
    if (status === "DRAFT" || status === "PUBLISHED") q.set("status", status);
    if (category) q.set("category", category);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `/admin/blog?${qs}` : "/admin/blog";
  }

  return (
    <div className="space-y-4">
      <BlogAdminNotice notice={notice} />

      <div className="rounded-xl border border-[#dcdcde] bg-white px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1d2327]">Posts</h1>
            <Link
              href="/admin/blog/new"
              className="rounded-md bg-[#2271b1] px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-[#135e96]"
            >
              Add new
            </Link>
            <span className="text-sm text-[#646970]">
              {totalAll} total
              {total !== totalAll ? ` · ${total} matching` : ""}
            </span>
          </div>
          <form action="/admin/blog" method="get" className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <input
              type="search"
              name="s"
              defaultValue={search ?? ""}
              placeholder="Search title or slug…"
              className="min-w-[12rem] flex-1 rounded border border-[#8c8f94] px-2 py-1.5 text-sm sm:flex-none"
            />
            <select
              name="status"
              defaultValue={status === "DRAFT" || status === "PUBLISHED" ? status : ""}
              className="rounded border border-[#8c8f94] px-2 py-1.5 text-sm"
              aria-label="Status"
            >
              <option value="">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
            <select
              name="category"
              defaultValue={category ?? ""}
              className="max-w-[10rem] rounded border border-[#8c8f94] px-2 py-1.5 text-sm"
              aria-label="Category"
            >
              <option value="">All categories</option>
              {categories.map((c) =>
                c.category ? (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ) : null,
              )}
            </select>
            <button
              type="submit"
              className="rounded border border-[#2271b1] bg-[#f6f7f7] px-3 py-1.5 text-sm font-medium text-[#2271b1] hover:bg-white"
            >
              Filter
            </button>
          </form>
        </div>

        <p className="mt-2 text-xs text-[#646970]">
          Showing {from}–{to} of {total}
          {search ? ` for “${search}”` : ""}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#dcdcde] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#dcdcde] bg-[#f6f7f7] text-xs font-semibold uppercase tracking-wide text-[#646970]">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">SEO</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#646970]">
                  No posts found.{" "}
                  <Link href="/admin/blog/new" className="text-[#2271b1] hover:underline">
                    Add your first post
                  </Link>
                </td>
              </tr>
            ) : (
              rows.map((p) => {
                const warnings = seoWarnings(p);
                return (
                  <tr key={p.id} className="border-b border-[#f0f0f1] last:border-0 hover:bg-[#f6f7f7]/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/blog/${p.id}`} className="font-medium text-[#2271b1] hover:underline">
                        {p.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-[#646970]">{p.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${
                          p.status === "PUBLISHED"
                            ? "bg-green-100 text-green-900"
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#50575e]">{p.category ?? "—"}</td>
                    <td className="px-4 py-3 text-[#50575e]">{p.author.name ?? p.author.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#50575e]">{formatDate(p.updatedAt)}</td>
                    <td className="px-4 py-3">
                      {warnings.length === 0 ? (
                        <span className="text-xs text-green-700">OK</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {warnings.map((w) => (
                            <li key={w} className="text-xs text-amber-800">
                              {w}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/blog/${p.id}`} className="text-[#2271b1] hover:underline">
                        Edit
                      </Link>
                      {p.status === "PUBLISHED" ? (
                        <>
                          {" · "}
                          <Link href={`/blog/${p.slug}`} className="text-[#2271b1] hover:underline" target="_blank" rel="noreferrer">
                            View
                          </Link>
                        </>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-2 text-sm" aria-label="Pagination">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="rounded border border-[#dcdcde] px-3 py-1 hover:bg-[#f6f7f7]">
              Previous
            </Link>
          ) : null}
          <span className="text-[#646970]">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="rounded border border-[#dcdcde] px-3 py-1 hover:bg-[#f6f7f7]">
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
