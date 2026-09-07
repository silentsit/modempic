/**
 * Apply verified manufacturer / ingredient / strength values by slug.
 *
 *   dotenv -e .env -e .env.local -- npx tsx scripts/backfill-product-attributes.ts
 *   dotenv -e .env -e .env.local -- npx tsx scripts/backfill-product-attributes.ts --apply
 */
import { PrismaClient } from "@prisma/client";
import { VERIFIED_PRODUCT_ATTRIBUTES } from "../src/content/catalog/product-attributes";

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient();

async function main() {
  for (const row of VERIFIED_PRODUCT_ATTRIBUTES) {
    const existing = await prisma.product.findUnique({
      where: { slug: row.slug },
      select: { slug: true, manufacturer: true, activeIngredient: true, strengthMg: true },
    });
    if (!existing) {
      console.log(`skip missing ${row.slug}`);
      continue;
    }
    const data = {
      strengthMg: row.strengthMg ?? null,
      manufacturer: row.manufacturer ?? null,
      activeIngredient: row.activeIngredient ?? null,
    };
    console.log(row.slug, data);
    if (apply) {
      await prisma.product.update({ where: { slug: row.slug }, data });
    }
  }
  if (!apply) console.log("\nDry-run. Re-run with --apply to write.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
