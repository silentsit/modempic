/**
 * Publish MDX from scripts/content/ to BlogPost (keeps slug + publishedAt).
 *
 * From web/:
 *   npx tsx scripts/update-modafinil-vs-concerta-post.ts
 */

import { bootstrapEnvFromFiles, publishBlogMdx } from "./lib/publish-blog-mdx";

bootstrapEnvFromFiles();

publishBlogMdx({
  slug: "modafinil-vs-concerta",
  title: "Modafinil vs Concerta: OROS Methylphenidate Is ADHD Hardware, Not a Narcolepsy Label",
  seoTitle: "Modafinil vs Concerta: ADHD OROS vs Wake Drug Labels [2026]",
  seoDesc:
    "Concerta is Schedule II OROS methylphenidate for ADHD ages 6 to 65. It has no US narcolepsy indication. Adult ADHD meta-analyses favor methylphenidate; modafinil is the labeled wake drug.",
  excerpt:
    "Concerta is methylphenidate in an osmotic once-daily shell labeled for ADHD, not narcolepsy. Modafinil is the opposite: a Schedule IV wake drug with no ADHD approval.",
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
