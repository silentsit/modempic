/**
 * Create or update /blog/pregabalin-vs-gabapentin from scripts/content MDX.
 *
 * Agent workflow (content.mdc): (1) first draft without Humanize.txt,
 * (2) automatic humanize pass, (3) run this script.
 *
 * From web/:
 *   dotenv -e .env -e .env.local -- npx tsx scripts/update-pregabalin-vs-gabapentin-post.ts
 */

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { stripHumanizeMarker } from "../src/lib/blog/prepare-blog-mdx";
import { bootstrapEnvFromFiles, requestBlogRevalidation } from "./lib/publish-blog-mdx";

const SLUG = "pregabalin-vs-gabapentin";
const AUTHOR_EMAIL = "info@modempic.com";
const CATEGORY = "Anti-Epileptic";
const HERO_IMAGE_URL =
  "https://res.cloudinary.com/df923uv8w/image/upload/v1789626916/modempic/blog/pregabalin-vs-gabapentin/absorption.jpg";

const TITLE = "Pregabalin vs Gabapentin: Linear Absorption vs a Saturable One";
const SEO_TITLE = "Pregabalin vs Gabapentin: Absorption, Schedule V, and Labels";
const SEO_DESC =
  "Pregabalin vs gabapentin splits on absorption and US schedule. Lyrica is Schedule V; Neurontin is not federally. This catalog lists Nervigesic 300 mg only.";
const EXCERPT =
  "Pregabalin is Schedule V with linear uptake. Gabapentin is not federally scheduled and saturates as the dose rises. This catalog lists Nervigesic 300 mg and no gabapentin SKU.";

function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

bootstrapEnvFromFiles();

const prisma = new PrismaClient();

async function main() {
  const mdxPath = path.join(process.cwd(), "scripts/content/pregabalin-vs-gabapentin.mdx");
  const rawMdx = fs.readFileSync(mdxPath, "utf8").trim();
  if (!rawMdx.startsWith("<!-- modempic:humanized -->")) {
    throw new Error("Missing humanize marker on first line of pregabalin-vs-gabapentin.mdx");
  }
  const mdx = stripHumanizeMarker(rawMdx);
  const readMinutes = estimateReadMinutes(mdx);

  const existing = await prisma.blogPost.findUnique({
    where: { slug: SLUG },
    select: { id: true, publishedAt: true, title: true },
  });

  const payload = {
    title: TITLE,
    seoTitle: SEO_TITLE,
    seoDesc: SEO_DESC,
    excerpt: EXCERPT,
    mdx,
    readMinutes,
    status: "PUBLISHED",
    category: CATEGORY,
    heroImageUrl: HERO_IMAGE_URL,
  };

  if (!existing) {
    const author = await prisma.user.findUnique({
      where: { email: AUTHOR_EMAIL },
      select: { id: true },
    });
    if (!author) {
      throw new Error(`Author user not found for ${AUTHOR_EMAIL}`);
    }
    const created = await prisma.blogPost.create({
      data: {
        slug: SLUG,
        authorId: author.id,
        publishedAt: new Date(),
        ...payload,
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
        category: true,
      },
    });
    console.log("Created blog post:");
    console.log(JSON.stringify(created, null, 2));
  } else {
    const updated = await prisma.blogPost.update({
      where: { id: existing.id },
      data: payload,
      select: {
        id: true,
        slug: true,
        title: true,
        readMinutes: true,
        publishedAt: true,
        updatedAt: true,
        excerpt: true,
        seoDesc: true,
        category: true,
      },
    });
    console.log("Updated blog post:");
    console.log(JSON.stringify(updated, null, 2));
    console.log(`Previous title: ${existing.title}`);
  }

  console.log(`Word count (approx): ${mdx.split(/\s+/).filter(Boolean).length}`);
  await requestBlogRevalidation(SLUG);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
