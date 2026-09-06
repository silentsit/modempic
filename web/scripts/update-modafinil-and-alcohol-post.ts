/**
 * Publish MDX from scripts/content/ to BlogPost (keeps slug + publishedAt).
 *
 * From web/:
 *   npx tsx scripts/update-modafinil-and-alcohol-post.ts
 */

import { bootstrapEnvFromFiles, publishBlogMdx } from "./lib/publish-blog-mdx";

bootstrapEnvFromFiles();

publishBlogMdx({
  slug: "modafinil-and-alcohol",
  title: "Modafinil and Alcohol: The Label Says the Mix Has Not Been Studied",
  seoTitle: "Modafinil and Alcohol: Label Counseling, Not a Mixing Trial [2026]",
  seoDesc:
    "The Provigil label says alcohol plus modafinil has not been studied and to avoid alcohol. Dependence-treatment trials are a different question. NIAAA impairment facts.",
  excerpt:
    "The US label tells clinicians the combination has not been studied and that it is prudent to avoid alcohol. The papers that name both are mostly abstinence-treatment trials, not bar-lab PK.",
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
