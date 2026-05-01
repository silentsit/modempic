import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "info@modempic.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ModempicDev2025!";
  const adminHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Dale J. Shinju",
      emailVerified: new Date(),
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
    update: { role: Role.ADMIN, passwordHash: adminHash, name: "Dale J. Shinju" },
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

  await prisma.user.upsert({
    where: { email: "customer@modempic.com" },
    create: {
      email: "customer@modempic.com",
      name: "Demo Customer",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash("CustomerDev2025!", 12),
      role: Role.CUSTOMER,
    },
    update: {},
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

  await prisma.category.upsert({
    where: { slug: "skin-care" },
    create: {
      slug: "skin-care",
      name: "Skin care",
      description: "Skin health and topical wellness support.",
      seoTitle: "Skin care | Modempic",
      seoDesc: "Explore skin care products.",
    },
    update: {
      name: "Skin care",
      description: "Skin health and topical wellness support.",
      seoTitle: "Skin care | Modempic",
      seoDesc: "Explore skin care products.",
    },
  });

  await prisma.category.upsert({
    where: { slug: "vitamins" },
    create: {
      slug: "vitamins",
      name: "Vitamins",
      description: "Vitamins and daily nutritional support.",
      seoTitle: "Vitamins | Modempic",
      seoDesc: "Shop vitamins with transparent labeling.",
    },
    update: {
      name: "Vitamins",
      description: "Vitamins and daily nutritional support.",
      seoTitle: "Vitamins | Modempic",
      seoDesc: "Shop vitamins with transparent labeling.",
    },
  });

  await prisma.category.upsert({
    where: { slug: "cancer" },
    create: {
      slug: "cancer",
      name: "Cancer",
      description: "Supportive wellness products—always follow qualified clinician guidance.",
      seoTitle: "Cancer support products | Modempic",
      seoDesc: "Browse supportive wellness products.",
    },
    update: {
      name: "Cancer",
      description: "Supportive wellness products—always follow qualified clinician guidance.",
      seoTitle: "Cancer support products | Modempic",
      seoDesc: "Browse supportive wellness products.",
    },
  });

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
        text: "Modafinil, Ivermectin, Retatrutide and other supplements and medicines for cognitive enhancement, alternative treatments, and overall wellness.",
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
