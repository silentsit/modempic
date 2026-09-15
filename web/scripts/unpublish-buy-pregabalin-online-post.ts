/**
 * Unpublish buy-pregabalin-online — content lives on the Nervigesic product Description tab.
 * The slug 301's to /product/buy-lyrica-pregabalin-nervigesic-300-mg in next.config.ts.
 *
 * From web/:
 *   npx tsx scripts/unpublish-buy-pregabalin-online-post.ts
 */

import { PrismaClient } from "@prisma/client";
import { bootstrapEnvFromFiles } from "./lib/publish-blog-mdx";

const SLUG = "buy-pregabalin-online";

bootstrapEnvFromFiles();
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.blogPost.findUnique({
    where: { slug: SLUG },
    select: { id: true, status: true, title: true },
  });
  if (!existing) {
    throw new Error(`BlogPost not found for slug "${SLUG}"`);
  }
  const updated = await prisma.blogPost.update({
    where: { id: existing.id },
    data: { status: "DRAFT" },
    select: { id: true, slug: true, status: true, title: true, updatedAt: true },
  });
  console.log("Unpublished blog post (content is on the product Description tab):");
  console.log(JSON.stringify(updated, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
