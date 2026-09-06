/**
 * Publish MDX from scripts/content/ to BlogPost (keeps slug + publishedAt).
 *
 * From web/:
 *   npx tsx scripts/update-modafinil-and-productivity-post.ts
 */

import { bootstrapEnvFromFiles, publishBlogMdx } from "./lib/publish-blog-mdx";

bootstrapEnvFromFiles();

publishBlogMdx({
  slug: "modafinil-and-productivity",
  title: "Modafinil and Productivity: Small Lab Effects, Not a Workplace Indication",
  seoTitle: "Modafinil and Productivity: Healthy-Adult Effect Sizes vs the Label [2026]",
  seoDesc:
    "Modafinil is not labeled as a productivity drug. Battleday and Roberts found small, task-specific healthy-adult gains. The labeled job is leftover sleepiness in three adult sleep disorders.",
  excerpt:
    "The US label is leftover sleepiness, not a desk-day lifehack. Healthy-adult reviews show small, task-specific lab effects. This page replaces the old seven-benefits listicle.",
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
