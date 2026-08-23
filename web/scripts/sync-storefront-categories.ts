/**
 * Upsert storefront categories and assign products from legacy slugs.
 *
 * From web/:
 *   npm run sync:storefront-categories
 */

import { PrismaClient } from "@prisma/client";
import { syncStorefrontCategories } from "../src/lib/catalog/sync-storefront-categories";

const prisma = new PrismaClient();

async function main() {
  await syncStorefrontCategories(prisma);
  const cats = await prisma.category.findMany({
    where: { slug: { in: ["nootropics", "anti-epileptic", "skincare", "sexual-health"] } },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  for (const cat of cats) {
    console.log(`${cat.slug}: ${cat._count.products} product(s)`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
