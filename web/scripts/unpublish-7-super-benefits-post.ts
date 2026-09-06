/**
 * Unpublish the commodity duplicate of modafinil-and-productivity.
 * The slug is 301'd in next.config.ts.
 *
 * From web/:
 *   npx tsx scripts/unpublish-7-super-benefits-post.ts
 */

import { PrismaClient } from "@prisma/client";
import { bootstrapEnvFromFiles } from "./lib/publish-blog-mdx";

const SLUG = "7-super-benefits-modafinil-productivity";

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
  console.log("Unpublished duplicate post:");
  console.log(JSON.stringify(updated, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
