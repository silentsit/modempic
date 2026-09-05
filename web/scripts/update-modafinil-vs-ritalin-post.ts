/**
 * Publish MDX from scripts/content/ to BlogPost (keeps slug + publishedAt).
 *
 * Agent workflow (content.mdc): (1) first draft without Humanize.txt,
 * (2) automatic humanize pass + replenish word count if trimmed, (3) run this script.
 *
 * From web/:
 *   dotenv -e .env -e .env.local -- npx tsx scripts/update-modafinil-vs-ritalin-post.ts
 */

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { stripHumanizeMarker } from "../src/lib/blog/prepare-blog-mdx";

const SLUG = "modafinil-vs-ritalin";

const TITLE = "Modafinil vs Ritalin: The DEA Says It Is 50 to 100 Times Weaker, Not Different";
const SEO_TITLE = "Modafinil vs Ritalin (Methylphenidate): DEA Data, ADHD & Narcolepsy [2026]";
const SEO_DESC =
  "The DEA says modafinil is 50 to 100 times less potent than methylphenidate, not a different drug. Schedules, the 2019 ADHD meta-analysis, and narcolepsy data compared.";
const EXCERPT =
  "Modafinil vs Ritalin is usually pitched as gentle vs harsh. The DEA's own scheduling filing says modafinil produces the same stimulant effects at 50 to 100 times the dose. Labels, abuse data, and the ADHD trial numbers, not vibes.";

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
  const mdxPath = path.join(process.cwd(), "scripts/content/modafinil-vs-ritalin.mdx");
  const rawMdx = fs.readFileSync(mdxPath, "utf8").trim();
  if (!rawMdx.startsWith("<!-- modempic:humanized -->")) {
    throw new Error("Missing humanize marker on first line of modafinil-vs-ritalin.mdx");
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
