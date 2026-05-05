/**
 * One-off cleanup: restore canonical drug-name casing for products mangled by the WooCommerce title-case import.
 * Idempotent — safe to re-run; it skips rows that already have the canonical name.
 *
 * Usage (from `web/`):
 *   npx tsx -r dotenv/config scripts/fix-product-names.ts dotenv_config_path=.env.local
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RENAMES: Record<string, string> = {
  "buy-armodaxl-150-mg": "ArmodaXL 150 mg",
  "buy-armodaxl-250-mg": "ArmodaXL 250 mg",
  "buy-artvigil-150-mg": "Artvigil 150 mg",
  "buy-artvigil-250-mg": "Artvigil 250 mg",
  "buy-modactive-200-mg": "Modactive 200 mg",
  "buy-modafil-md-200-mg": "Modafil MD 200 mg",
  "buy-modaheal-200-mg": "Modaheal 200 mg",
  "buy-modalert-200-mg": "Modalert 200 mg",
  "buy-modasmart-400-mg": "Modasmart 400 mg",
  "buy-modavinil-200-mg": "Modavinil 200 mg",
  "buy-modawake-200-mg": "Modawake 200 mg",
  "buy-modaxl-300-mg": "ModaXL 300 mg",
  "buy-modvigil-200-mg": "Modvigil 200 mg",
  "buy-vilafinil-200-mg": "Vilafinil 200 mg",
  "buy-waklert-150-mg": "Waklert 150 mg",
};

async function main() {
  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const [slug, name] of Object.entries(RENAMES)) {
    const current = await prisma.product.findUnique({ where: { slug }, select: { name: true } });
    if (!current) {
      console.log(`(skip, missing) ${slug}`);
      missing++;
      continue;
    }
    if (current.name === name) {
      console.log(`(skip, ok)      ${slug} -> ${name}`);
      skipped++;
      continue;
    }
    await prisma.product.update({ where: { slug }, data: { name } });
    console.log(`updated         ${slug} -> ${name}`);
    updated++;
  }

  console.log(`\nDone. updated=${updated} skipped=${skipped} missing=${missing}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
