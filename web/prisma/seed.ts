import { PrismaClient, ProductStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { backfillAllProductVariants } from "../src/lib/catalog/backfill-product-variants";
import { syncProductVariants } from "../src/lib/catalog/product-variant-store";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "info@modempic.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ModempicDev2025!";
  const adminHash = await bcrypt.hash(adminPassword, 12);
  const resetPasswords = process.env.SEED_RESET_PASSWORDS === "1";

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Dale J. Shinju",
      emailVerified: new Date(),
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
    update: {
      role: Role.ADMIN,
      name: "Dale J. Shinju",
      ...(resetPasswords ? { passwordHash: adminHash } : {}),
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@modempic.com" },
    create: {
      email: "staff@modempic.com",
      name: "Store Staff",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash("StaffDev2025!", 12),
      role: Role.STAFF,
    },
    update: {},
  });

  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD ?? "CustomerDev2025!";
  await prisma.user.upsert({
    where: { email: "customer@modempic.com" },
    create: {
      email: "customer@modempic.com",
      name: "Demo Customer",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash(customerPassword, 12),
      role: Role.CUSTOMER,
    },
    update: resetPasswords ? { passwordHash: await bcrypt.hash(customerPassword, 12) } : {},
  });

  const DEMO_PRODUCT_SLUGS = [
    "daily-multivitamin",
    "vitamin-d3-k2",
    "omega-3-softgels",
    "magnesium-glycinate",
    "ashwagandha-capsules",
    "turmeric-curcumin",
    "probiotic-50b",
    "zinc-picolinate",
  ] as const;

  const removedDemo = await prisma.product.deleteMany({
    where: { slug: { in: [...DEMO_PRODUCT_SLUGS] } },
  });
  console.log(
    `Seed: deleted ${removedDemo.count} demo product row(s) (matched slugs: ${DEMO_PRODUCT_SLUGS.join(", ")}).`,
  );
  if (removedDemo.count === 0) {
    console.log(
      "  → If you still see old demo items in the app, either they use different slugs, or this DB never had those rows—run against the same DATABASE_URL as `next dev`.",
    );
  }

  const catModafinil = await prisma.category.upsert({
    where: { slug: "modafinil" },
    create: {
      slug: "modafinil",
      name: "Modafinil",
      description: "Modafinil and armodafinil-line wellness products.",
      seoTitle: "Modafinil | Modempic",
      seoDesc: "Shop modafinil-range products.",
    },
    update: {
      name: "Modafinil",
      description: "Modafinil and armodafinil-line wellness products.",
      seoTitle: "Modafinil | Modempic",
      seoDesc: "Shop modafinil-range products.",
    },
  });

  /** Retire legacy vitamins category: move links to modafinil, then delete vitamins (matches migration `remove_vitamins_category`). */
  const vitaminsCat = await prisma.category.findUnique({ where: { slug: "vitamins" } });
  if (vitaminsCat) {
    const vitaminLinks = await prisma.productCategory.findMany({ where: { categoryId: vitaminsCat.id } });
    for (const row of vitaminLinks) {
      await prisma.productCategory.upsert({
        where: {
          productId_categoryId: { productId: row.productId, categoryId: catModafinil.id },
        },
        create: { productId: row.productId, categoryId: catModafinil.id },
        update: {},
      });
      await prisma.productCategory.delete({
        where: {
          productId_categoryId: { productId: row.productId, categoryId: vitaminsCat.id },
        },
      });
    }
    await prisma.couponCategoryInclude.deleteMany({ where: { categoryId: vitaminsCat.id } });
    await prisma.couponCategoryExclude.deleteMany({ where: { categoryId: vitaminsCat.id } });
    await prisma.category.delete({ where: { id: vitaminsCat.id } });
    console.log(
      `Seed: removed legacy vitamins category (${vitaminLinks.length} product link(s) reconciled to modafinil).`,
    );
  }

  await prisma.category.deleteMany({ where: { slug: "peptides" } });

  const catalogCat = await prisma.category.findUnique({ where: { slug: "catalog" } });
  if (catalogCat) {
    const rows = await prisma.productCategory.findMany({ where: { categoryId: catalogCat.id } });
    for (const row of rows) {
      await prisma.productCategory.delete({
        where: { productId_categoryId: { productId: row.productId, categoryId: catalogCat.id } },
      });
      await prisma.productCategory.upsert({
        where: {
          productId_categoryId: { productId: row.productId, categoryId: catModafinil.id },
        },
        create: { productId: row.productId, categoryId: catModafinil.id },
        update: {},
      });
    }
    await prisma.category.delete({ where: { id: catalogCat.id } });
  }

  await prisma.category.deleteMany({ where: { slug: { in: ["herbs", "minerals"] } } });

  await prisma.blogPost.deleteMany({
    where: { slug: { in: ["how-to-read-a-supplement-label", "building-a-simple-morning-routine"] } },
  });

  const e2eProduct = await prisma.product.upsert({
    where: { slug: "e2e-checkout-product" },
    create: {
      slug: "e2e-checkout-product",
      name: "E2E Checkout Product",
      shortDesc: "Stable CI product for automated checkout tests.",
      longDesc: "Catalog item seeded for Playwright checkout coverage.",
      priceCents: 5000,
      status: ProductStatus.PUBLISHED,
      seoTitle: "E2E Checkout Product | Modempic",
      seoDesc: "Seeded product for automated checkout tests.",
      images: {
        create: {
          url: "https://placehold.co/600x600/png",
          alt: "E2E checkout product placeholder image",
          sortOrder: 0,
        },
      },
    },
    update: {
      name: "E2E Checkout Product",
      priceCents: 5000,
      status: ProductStatus.PUBLISHED,
      seoTitle: "E2E Checkout Product | Modempic",
      seoDesc: "Seeded product for automated checkout tests.",
    },
  });
  await prisma.productImage.deleteMany({ where: { productId: e2eProduct.id } });
  await prisma.productImage.create({
    data: {
      productId: e2eProduct.id,
      url: "https://placehold.co/600x600/png",
      alt: "E2E checkout product placeholder image",
      sortOrder: 0,
    },
  });
  await prisma.productCategory.deleteMany({ where: { productId: e2eProduct.id } });
  await prisma.productCategory.create({
    data: { productId: e2eProduct.id, categoryId: catModafinil.id },
  });
  await prisma.$transaction(async (tx) => {
    await syncProductVariants(tx, {
      productId: e2eProduct.id,
      productSlug: e2eProduct.slug,
      productName: e2eProduct.name,
      priceCents: e2eProduct.priceCents,
      compareAtCents: e2eProduct.compareAtCents,
      tiers: [{ label: e2eProduct.name, priceCents: e2eProduct.priceCents }],
    });
  });

  const variantBackfill = await backfillAllProductVariants();
  console.log(
    `Seed: synced product variants for ${variantBackfill.products} product(s); linked ${variantBackfill.cartLines} cart line(s).`,
  );

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    create: {
      code: "WELCOME10",
      description: "New customer 10% off",
      type: "PERCENT",
      value: 10,
      minOrderCents: 2000,
      active: true,
    },
    update: {},
  });

  await prisma.emailTemplate.upsert({
    where: { key: "order-confirmation" },
    create: {
      key: "order-confirmation",
      subject: "Your Modempic order {{orderNumber}}",
      bodyHint: "Order summary and next steps for payment",
      active: true,
    },
    update: {},
  });

  await prisma.emailTemplate.upsert({
    where: { key: "password-reset" },
    create: {
      key: "password-reset",
      subject: "Reset your Modempic password",
      active: true,
    },
    update: {},
  });

  const settings = [
    { key: "store.name", value: { value: "Modempic" } },
    { key: "store.supportEmail", value: { value: "info@modempic.com" } },
    { key: "payment.crypto.defaultAsset", value: { asset: "USDT" } },
    { key: "payment.guardarian.mode", value: { mode: "sandbox" } },
    {
      key: "site.hero.title",
      value: { text: "No games.\nNo dishonesty.\nWe don't like wasting time." },
    },
    {
      key: "site.hero.subtitle",
      value: {
        text: "Modafinil catalog items with clear pack sizes, secure checkout, and straightforward ordering.",
      },
    },
  ];

  for (const s of settings) {
    await prisma.storeSetting.upsert({
      where: { key: s.key },
      create: { key: s.key, value: s.value as object },
      update: { value: s.value as object },
    });
  }

  console.log("Seed done. Admin:", adminEmail, "/ password from SEED_ADMIN_PASSWORD or default shown in repo docs only for local dev");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
