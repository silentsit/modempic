/**
 * Publish MDX from scripts/content/ to BlogPost (keeps slug + publishedAt).
 *
 * From web/:
 *   npx tsx scripts/update-modafinil-and-caffeine-post.ts
 */

import { bootstrapEnvFromFiles, publishBlogMdx } from "./lib/publish-blog-mdx";

bootstrapEnvFromFiles();

publishBlogMdx({
  slug: "modafinil-and-caffeine",
  title: "Modafinil and Caffeine: What the Sleep-Deprivation Trials Actually Show",
  seoTitle: "Modafinil and Caffeine: Sleep-Deprivation Trials, Not a Stack [2026]",
  seoDesc:
    "No labeled combination and no dedicated mix RCT. Walter Reed compared caffeine and modafinil as separate arms during sleep loss. CYP1A2 probe data and the FDA 400 mg caffeine figure.",
  excerpt:
    "The Provigil label does not publish a caffeine stack. Sleep-deprivation trials compared the two as separate arms. CYP1A2 probe data left caffeine exposure near unchanged.",
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
