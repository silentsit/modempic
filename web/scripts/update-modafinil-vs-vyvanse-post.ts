/**
 * Publish MDX from scripts/content/ to BlogPost (keeps slug + publishedAt).
 *
 * From web/:
 *   npx tsx scripts/update-modafinil-vs-vyvanse-post.ts
 */

import { bootstrapEnvFromFiles, publishBlogMdx } from "./lib/publish-blog-mdx";

bootstrapEnvFromFiles();

publishBlogMdx({
  slug: "modafinil-vs-vyvanse",
  title: "Modafinil vs Vyvanse: A Prodrug Amphetamine Is Not a Wake-Drug Cousin",
  seoTitle: "Modafinil vs Vyvanse: ADHD and BED Labels vs Wake Indications [2026]",
  seoDesc:
    "Vyvanse is Schedule II lisdexamfetamine for ADHD and adult binge eating, not narcolepsy. Amphetamine-class ADHD meta-analyses favor it; modafinil is the labeled wake drug.",
  excerpt:
    "Vyvanse is a lisdexamfetamine prodrug that becomes dextroamphetamine. Labeled for ADHD and adult binge eating, not sleep disorders. Modafinil is the opposite pair of indications.",
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
