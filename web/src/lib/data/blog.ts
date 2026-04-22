import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";

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
