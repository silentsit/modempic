/**
 * Publish MDX from scripts/content/ to BlogPost (keeps slug + publishedAt).
 *
 * Agent workflow (content.mdc): (1) first draft without Humanize.txt,
 * (2) automatic humanize pass + replenish word count if trimmed, (3) run this script.
 *
 * From web/:
 *   dotenv -e .env -e .env.local -- npx tsx scripts/update-what-is-modafinil-post.ts
 */

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { stripHumanizeMarker } from "../src/lib/blog/prepare-blog-mdx";

const SLUG = "what-is-modafinil";

const TITLE = "What Is Modafinil: Wakefulness Drug, Schedule IV, Not a Universal Smart Drug";
const SEO_TITLE = "What Is Modafinil: Wakefulness Drug, Schedule IV, Not a Universal Smart Drug [2026]";
const SEO_DESC =
  "Modafinil is a wakefulness-promoting agent for narcolepsy, OSA, and shift work, and Schedule IV. Smart-drug gains in healthy adults are small and task-specific.";
const EXCERPT =
  "A wakefulness-promoting agent labeled for three adult sleep indications, and a Schedule IV controlled substance. Healthy-adult 'smart drug' gains are small and task-specific, not universal focus.";

function bootstrapEnvFromFiles() {
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

bootstrapEnvFromFiles();

const prisma = new PrismaClient();

async function main() {
  const mdxPath = path.join(process.cwd(), "scripts/content/what-is-modafinil.mdx");
  const rawMdx = fs.readFileSync(mdxPath, "utf8").trim();
  if (!rawMdx.startsWith("<!-- modempic:humanized -->")) {
    throw new Error("Missing humanize marker on first line of what-is-modafinil.mdx");
  }
  const mdx = stripHumanizeMarker(rawMdx);
  const readMinutes = estimateReadMinutes(mdx);

  const existing = await prisma.blogPost.findUnique({
    where: { slug: SLUG },
    select: { id: true, publishedAt: true, title: true },
  });

  if (!existing) {
    throw new Error(`BlogPost not found for slug "${SLUG}"`);
  }

  const updated = await prisma.blogPost.update({
    where: { id: existing.id },
    data: {
      title: TITLE,
      seoTitle: SEO_TITLE,
      seoDesc: SEO_DESC,
      excerpt: EXCERPT,
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
