import { PrismaClient, ProductStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DISCLAIM =
  "* These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.";

async function main() {
  const adminEmail = "info@modempic.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ModempicDev2025!";
  const adminHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
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

  const staff = await prisma.user.upsert({
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

  const catVitamins = await prisma.category.upsert({
    where: { slug: "vitamins" },
    create: {
      slug: "vitamins",
      name: "Vitamins",
      description: "Daily vitamins to support general wellness when used as directed.",
      seoTitle: "Vitamins | Modempic",
      seoDesc: "Shop quality vitamins with transparent labeling.",
    },
    update: {},
  });

  const catHerbs = await prisma.category.upsert({
    where: { slug: "herbs" },
    create: {
      slug: "herbs",
      name: "Herbal wellness",
      description: "Herbal ingredients traditionally used for general wellness support.",
      seoTitle: "Herbal supplements | Modempic",
      seoDesc: "Explore herbal wellness products.",
    },
    update: {},
  });

  const catMinerals = await prisma.category.upsert({
    where: { slug: "minerals" },
    create: {
      slug: "minerals",
      name: "Minerals",
      description: "Mineral support for everyday nutrition alongside a balanced diet.",
      seoTitle: "Minerals | Modempic",
      seoDesc: "Mineral supplements to complement your routine.",
    },
    update: {},
  });

  const products = [
    {
      slug: "daily-multivitamin",
      name: "Daily multivitamin",
      shortDesc: "Broad-spectrum vitamins and minerals for general daily support.",
      longDesc: `Formulated to help fill common dietary gaps when diet alone may not be enough. Take as directed on the label.\n\n${DISCLAIM}`,
      priceCents: 2499,
      compareAtCents: 2999,
      isBestSeller: true,
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474e2ae?w=800&q=80",
      categories: [catVitamins.id],
    },
    {
      slug: "vitamin-d3-k2",
      name: "Vitamin D3 + K2",
      shortDesc: "Supports bone health and calcium utilization as part of a balanced lifestyle.*",
      longDesc: `Vitamin D3 and K2 work together in this blend to support how your body uses calcium when combined with adequate nutrition and movement.*\n\n${DISCLAIM}`,
      priceCents: 1999,
      isBestSeller: true,
      image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&q=80",
      categories: [catVitamins.id],
    },
    {
      slug: "omega-3-softgels",
      name: "Omega-3 softgels",
      shortDesc: "EPA and DHA fatty acids to support heart and brain structure and function.*",
      longDesc: `Concentrated omega-3 fatty acids from fish oil, tested for purity. May support cardiovascular and cognitive health as part of a healthy diet.*\n\n${DISCLAIM}`,
      priceCents: 3299,
      compareAtCents: 3799,
      isBestSeller: true,
      image: "https://images.unsplash.com/photo-1628771065518-70d0a1b0d4a1?w=800&q=80",
      categories: [catVitamins.id, catMinerals.id],
    },
    {
      slug: "magnesium-glycinate",
      name: "Magnesium glycinate",
      shortDesc: "Gentle magnesium form to support muscle relaxation and sleep routine.*",
      longDesc: `Magnesium plays a role in muscle and nerve function. This form is often chosen for evening routines; individual needs vary.*\n\n${DISCLAIM}`,
      priceCents: 2299,
      isBestSeller: true,
      image: "https://images.unsplash.com/photo-1587854692152-cbc33042b5b2?w=800&q=80",
      categories: [catMinerals.id],
    },
    {
      slug: "ashwagandha-capsules",
      name: "Ashwagandha capsules",
      shortDesc: "Adaptogenic herb traditionally used to help the body adapt to occasional stress.*",
      longDesc: `Root extract standardized for withanolides. Often used to support a sense of calm focus; not a substitute for medical care.*\n\n${DISCLAIM}`,
      priceCents: 2799,
      isBestSeller: true,
      image: "https://images.unsplash.com/photo-1616671276871-3ed366066614?w=800&q=80",
      categories: [catHerbs.id],
    },
    {
      slug: "turmeric-curcumin",
      name: "Turmeric curcumin",
      shortDesc: "Curcuminoids with black pepper extract for absorption support.*",
      longDesc: `Turmeric has a long history of traditional use. This formula is designed to support joint comfort for healthy adults when used as directed.*\n\n${DISCLAIM}`,
      priceCents: 2699,
      isBestSeller: true,
      image: "https://images.unsplash.com/photo-1615485500704-8e68f0b3b0a0?w=800&q=80",
      categories: [catHerbs.id],
    },
    {
      slug: "probiotic-50b",
      name: "Probiotic 50B CFU",
      shortDesc: "Multi-strain blend to support digestive balance for everyday comfort.*",
      longDesc: `Shelf-stable strains selected for diversity. Intended to complement fiber intake and hydration; results vary by individual.*\n\n${DISCLAIM}`,
      priceCents: 3499,
      isBestSeller: true,
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
      categories: [catVitamins.id],
    },
    {
      slug: "zinc-picolinate",
      name: "Zinc picolinate",
      shortDesc: "Immune system and skin health support as part of overall nutrition.*",
      longDesc: `Zinc is an essential mineral involved in immune function and skin integrity. Do not exceed the recommended serving.*\n\n${DISCLAIM}`,
      priceCents: 1499,
      isBestSeller: true,
      image: "https://images.unsplash.com/photo-1559181567-c3195e4d4b4a?w=800&q=80",
      categories: [catMinerals.id],
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        name: p.name,
        shortDesc: p.shortDesc,
        longDesc: p.longDesc,
        priceCents: p.priceCents,
        compareAtCents: p.compareAtCents ?? null,
        status: ProductStatus.PUBLISHED,
        isBestSeller: p.isBestSeller,
        disclaimer: DISCLAIM,
        seoTitle: `${p.name} | Modempic`,
        seoDesc: p.shortDesc,
        images: {
          create: [{ url: p.image, alt: p.name, sortOrder: 0 }],
        },
      },
      update: {
        name: p.name,
        shortDesc: p.shortDesc,
        longDesc: p.longDesc,
        priceCents: p.priceCents,
        compareAtCents: p.compareAtCents ?? null,
        status: ProductStatus.PUBLISHED,
        isBestSeller: p.isBestSeller,
        disclaimer: DISCLAIM,
      },
    });

    await prisma.productCategory.deleteMany({ where: { productId: product.id } });
    for (const cid of p.categories) {
      await prisma.productCategory.create({
        data: { productId: product.id, categoryId: cid },
      });
    }
  }

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
