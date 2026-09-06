import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { stripHumanizeMarker } from "../../src/lib/blog/prepare-blog-mdx";

export type BlogPublishMeta = {
  slug: string;
  title: string;
  seoTitle: string;
  seoDesc: string;
  excerpt: string;
};

export function bootstrapEnvFromFiles() {
  const root = process.cwd();
  for (const name of [".env.local", ".env"]) {
    const fp = path.join(root, name);
    if (!fs.existsSync(fp)) continue;
    const txt = fs.readFileSync(fp, "utf8").replace(/^\uFEFF/, "");
    for (const rawLine of txt.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function publishBlogMdx(meta: BlogPublishMeta) {
  const prisma = new PrismaClient();
  try {
    const mdxPath = path.join(process.cwd(), "scripts/content", `${meta.slug}.mdx`);
    const rawMdx = fs.readFileSync(mdxPath, "utf8").trim();
    if (!rawMdx.startsWith("<!-- modempic:humanized -->")) {
      throw new Error(`Missing humanize marker on first line of ${meta.slug}.mdx`);
    }
    const mdx = stripHumanizeMarker(rawMdx);
    const readMinutes = estimateReadMinutes(mdx);

    const existing = await prisma.blogPost.findUnique({
      where: { slug: meta.slug },
      select: { id: true, publishedAt: true, title: true },
    });

    if (!existing) {
      throw new Error(`BlogPost not found for slug "${meta.slug}"`);
    }

    const updated = await prisma.blogPost.update({
      where: { id: existing.id },
      data: {
        title: meta.title,
        seoTitle: meta.seoTitle,
        seoDesc: meta.seoDesc,
        excerpt: meta.excerpt,
        mdx,
        readMinutes,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        slug: true,
        title: true,
        readMinutes: true,
        publishedAt: true,
        updatedAt: true,
        excerpt: true,
        seoDesc: true,
      },
    });

    console.log("Updated blog post:");
    console.log(JSON.stringify(updated, null, 2));
    console.log(`Word count (approx): ${mdx.split(/\s+/).filter(Boolean).length}`);
    console.log(`Previous title: ${existing.title}`);
  } finally {
    await prisma.$disconnect();
  }
}
