import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";

export const ADMIN_BLOG_PAGE_SIZE = 25;

export type AdminBlogListParams = {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
};

function adminBlogWhere(params: AdminBlogListParams): Prisma.BlogPostWhereInput {
  const search = params.search?.trim();
  const status = params.status?.trim();
  const category = params.category?.trim();

  return {
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status === "DRAFT" || status === "PUBLISHED" ? { status } : {}),
    ...(category ? { category } : {}),
  };
}

export async function listAdminBlogPosts(params: AdminBlogListParams = {}) {
  const requestedPage = Math.max(1, Math.floor(params.page ?? 1));
  const where = adminBlogWhere(params);

  return prismaDevOr(
    "listAdminBlogPosts",
    async () => {
      const [total, totalAll] = await Promise.all([
        prisma.blogPost.count({ where }),
        prisma.blogPost.count(),
      ]);
      const totalPages = Math.max(1, Math.ceil(total / ADMIN_BLOG_PAGE_SIZE));
      const page = Math.min(requestedPage, totalPages);
      const skip = (page - 1) * ADMIN_BLOG_PAGE_SIZE;

      const rows = await prisma.blogPost.findMany({
          where,
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          skip,
          take: ADMIN_BLOG_PAGE_SIZE,
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            category: true,
            excerpt: true,
            seoDesc: true,
            publishedAt: true,
            updatedAt: true,
            author: { select: { name: true, email: true } },
          },
        });

      return {
        rows,
        total,
        totalAll,
        page,
        pageSize: ADMIN_BLOG_PAGE_SIZE,
        totalPages,
      };
    },
    { rows: [], total: 0, totalAll: 0, page: 1, pageSize: ADMIN_BLOG_PAGE_SIZE, totalPages: 1 },
  );
}

export async function listAdminBlogCategories() {
  return prismaDevOr(
    "listAdminBlogCategories",
    () =>
      prisma.blogPost.groupBy({
        by: ["category"],
        where: { category: { not: null } },
        orderBy: { category: "asc" },
      }),
    [],
  );
}

export async function getAdminBlogPostById(id: string) {
  return prismaDevOr(
    "getAdminBlogPostById",
    () =>
      prisma.blogPost.findUnique({
        where: { id },
        include: { author: { select: { name: true, email: true } } },
      }),
    null,
  );
}

export async function getPublishedPosts() {
  return prismaDevOr(
    "getPublishedPosts",
    () =>
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED", publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
        include: { author: { select: { name: true } } },
      }),
    [],
  );
}

export async function getPostBySlug(slug: string) {
  return prismaDevOr(
    "getPostBySlug",
    () =>
      prisma.blogPost.findFirst({
        where: { slug, status: "PUBLISHED", publishedAt: { not: null } },
        include: { author: { select: { name: true, image: true } } },
      }),
    null,
  );
}
