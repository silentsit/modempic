"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma, ProductStatus, OrderStatus, ReviewStatus } from "@prisma/client";
import { requireStaff } from "@/lib/auth/admin";
import { normalizeEmailAppearance } from "@/lib/email/email-appearance";
import { persistEmailAppearance } from "@/lib/email/appearance-store";
import { orderStatusWriteData } from "@/lib/domain/order-completion";
import { parseUsdToCents } from "@/lib/domain/money";
import { lowestPriceFromTiers, parseVariantTiers } from "@/lib/product-variants";
import { sanitizeProductBodyHtml } from "@/lib/product-html";

// ---- Products
const httpsImageUrl = z
  .string()
  .trim()
  .url()
  .refine((u) => /^https:\/\//i.test(u), "Image URLs must use HTTPS");

const productBaseIn = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  shortDesc: z.string().min(1).max(500),
  longDesc: z.string().min(1).max(20000),
  bodyHtml: z.string().max(100000).optional(),
  status: z.nativeEnum(ProductStatus),
  isBestSeller: z.boolean().optional(),
  disclaimer: z.string().max(2000).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDesc: z.string().max(500).optional(),
});

function parseOptionalJson(raw: string | undefined): { ok: true; value?: Prisma.InputJsonValue | typeof Prisma.JsonNull } | { ok: false } {
  if (!raw?.trim()) return { ok: true, value: Prisma.JsonNull };
  try {
    return { ok: true, value: JSON.parse(raw) as Prisma.InputJsonValue };
  } catch {
    return { ok: false };
  }
}

function parseOptionalDate(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function collectHttpsProductImages(
  productName: string,
  featuredRaw: string,
  galleryText: string,
): { ok: true; rows: { url: string; alt: string; sortOrder: number }[] } | { ok: false; error: string } {
  const featured = featuredRaw.trim();
  if (!featured) return { ok: false, error: "Add a featured product image URL (HTTPS)." };
  const f = httpsImageUrl.safeParse(featured);
  if (!f.success) return { ok: false, error: "Featured image must be a valid HTTPS URL." };
  const rows: { url: string; alt: string; sortOrder: number }[] = [
    { url: featured, alt: productName, sortOrder: 0 },
  ];
  let order = 1;
  const lines = galleryText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    if (line === featured) continue;
    const u = httpsImageUrl.safeParse(line);
    if (!u.success) {
      return {
        ok: false,
        error: `Invalid gallery URL (use HTTPS). Problem line starts with: ${line.slice(0, 48)}`,
      };
    }
    rows.push({ url: line, alt: productName, sortOrder: order++ });
  }
  return { ok: true, rows };
}

export async function upsertProductAction(
  _prev: { error?: string; success?: string; id?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string; id?: string } | null> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const productType = String(formData.get("productType") ?? "simple").toLowerCase() === "variable" ? "variable" : "simple";

  const parsedBase = productBaseIn.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    shortDesc: formData.get("shortDesc"),
    longDesc: formData.get("longDesc"),
    status: formData.get("status"),
    isBestSeller: formData.get("isBestSeller") === "on" ? true : false,
    disclaimer: String(formData.get("disclaimer") ?? "") || undefined,
    bodyHtml: String(formData.get("bodyHtml") ?? "") || undefined,
    seoTitle: String(formData.get("seoTitle") ?? "") || undefined,
    seoDesc: String(formData.get("seoDesc") ?? "") || undefined,
  });
  if (!parsedBase.success) {
    const msg = parsedBase.error.flatten().formErrors.join("; ") || "Check required fields (name, slug, descriptions).";
    return { error: msg };
  }
  const b = parsedBase.data;
  const bodyHtmlSanitized = b.bodyHtml?.trim() ? sanitizeProductBodyHtml(b.bodyHtml) : undefined;

  const featuredImage = String(formData.get("featuredImageUrl") ?? "");
  const galleryUrls = String(formData.get("galleryUrls") ?? "");
  const imgs = collectHttpsProductImages(b.name, featuredImage, galleryUrls);
  if (!imgs.ok) return { error: imgs.error };

  const categorySlugs = formData.getAll("categories").map((v) => String(v).trim()).filter(Boolean);

  let priceCents: number;
  let compareAtCents: number | null = null;
  let variantsValue: Prisma.InputJsonValue | typeof Prisma.JsonNull = Prisma.JsonNull;

  if (productType === "variable") {
    const rawJson = String(formData.get("variantsJson") ?? "").trim();
    if (!rawJson) return { error: "Variable products need at least two pricing tiers." };
    const variants = parseOptionalJson(rawJson);
    if (!variants.ok) return { error: "Variant tiers JSON is invalid." };
    const tiers = parseVariantTiers(variants.value);
    if (tiers.length < 2) {
      return { error: "Variable products need at least two pricing tiers (or switch to Simple product type)." };
    }
    variantsValue = variants.value as Prisma.InputJsonValue;
    const low = lowestPriceFromTiers(tiers);
    if (!low) return { error: "Could not derive a base price from tiers." };
    priceCents = low.priceCents;
    compareAtCents =
      tiers.length === 1 && low.compareAtCents != null && low.compareAtCents > low.priceCents ? low.compareAtCents : null;
  } else {
    const regular = String(formData.get("regularPrice") ?? "").trim();
    const compareRaw = String(formData.get("compareAtPrice") ?? "").trim();
    const pc = parseUsdToCents(regular);
    if (pc === null || pc < 0) return { error: "Enter a valid regular price in dollars (e.g. 35 or 35.99)." };
    priceCents = pc;
    if (compareRaw) {
      const cc = parseUsdToCents(compareRaw);
      if (cc === null || cc < 0) return { error: "Compare-at / sale price must be a valid dollar amount." };
      compareAtCents = cc > priceCents ? cc : null;
    }
    variantsValue = Prisma.JsonNull;
  }

  const productData = {
    name: b.name,
    slug: b.slug,
    shortDesc: b.shortDesc,
    longDesc: b.longDesc,
    bodyHtml: bodyHtmlSanitized ?? null,
    priceCents,
    compareAtCents,
    status: b.status,
    isBestSeller: b.isBestSeller ?? false,
    disclaimer: b.disclaimer,
    variants: variantsValue,
    seoTitle: b.seoTitle,
    seoDesc: b.seoDesc,
  };

  const imageCreate = imgs.rows.map((r) => ({ url: r.url, alt: r.alt, sortOrder: r.sortOrder }));

  try {
    if (id) {
      const p = await prisma.$transaction(async (tx) => {
        const row = await tx.product.update({
          where: { id },
          data: {
            ...productData,
            images: { deleteMany: {}, create: imageCreate },
          },
        });
        const cats = await tx.category.findMany({ where: { slug: { in: categorySlugs } } });
        await tx.productCategory.deleteMany({ where: { productId: row.id } });
        if (cats.length > 0) {
          await tx.productCategory.createMany({
            data: cats.map((c) => ({ productId: row.id, categoryId: c.id })),
          });
        }
        return row;
      });
      revalidatePath("/shop");
      revalidatePath("/admin/products");
      revalidatePath(`/product/${p.slug}`);
      return { success: "Saved" };
    }
    const p = await prisma.$transaction(async (tx) => {
      const row = await tx.product.create({
        data: {
          ...productData,
          images: { create: imageCreate },
        },
      });
      const cats = await tx.category.findMany({ where: { slug: { in: categorySlugs } } });
      if (cats.length > 0) {
        await tx.productCategory.createMany({
          data: cats.map((c) => ({ productId: row.id, categoryId: c.id })),
        });
      }
      return row;
    });
    revalidatePath("/shop");
    revalidatePath("/admin/products");
    return { success: "Created", id: p.id };
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
    if (code === "P2002") return { error: "That slug is already used by another product. Change the slug and try again." };
    console.error("[upsertProductAction]", e);
    return { error: "Could not save the product. Check the slug is unique and try again." };
  }
}

export async function deleteProductAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/products?status=PUBLISHED&notice=error");
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      slug: true,
      _count: {
        select: {
          cartLines: true,
          orderLines: true,
          reviews: true,
        },
      },
    },
  });
  if (!product) redirect("/admin/products?status=PUBLISHED&notice=error");

  const hasReferences =
    product._count.cartLines > 0 || product._count.orderLines > 0 || product._count.reviews > 0;
  if (hasReferences) {
    await prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.DRAFT,
        isBestSeller: false,
      },
    });
  } else {
    await prisma.product.delete({ where: { id } });
  }
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  revalidatePath(`/product/${product.slug}`);
  /** Land on Published-only list so archived (Draft) rows are not mixed into “All”. */
  const notice = hasReferences ? "archived" : "removed";
  redirect(`/admin/products?status=PUBLISHED&notice=${notice}`);
}

// ---- Orders
export async function setOrderStatusAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!id || !Object.values(OrderStatus).includes(status)) return;
  const existing = await prisma.order.findUnique({
    where: { id },
    select: { completedAt: true },
  });
  await prisma.order.update({
    where: { id },
    data: orderStatusWriteData(status, existing?.completedAt),
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

const orderEditSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(OrderStatus).optional(),
  trackingNumber: z.string().max(120).optional(),
  trackingCarrier: z.string().max(120).optional(),
  shippingMethod: z.string().max(120).optional(),
  adminNote: z.string().max(5000).optional(),
});

export async function updateOrderAction(formData: FormData) {
  await requireStaff();
  const parsed = orderEditSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    status: (formData.get("status") as OrderStatus) || undefined,
    trackingNumber: String(formData.get("trackingNumber") ?? "") || undefined,
    trackingCarrier: String(formData.get("trackingCarrier") ?? "") || undefined,
    shippingMethod: String(formData.get("shippingMethod") ?? "") || undefined,
    adminNote: String(formData.get("adminNote") ?? "") || undefined,
  });
  if (!parsed.success) return;
  const v = parsed.data;

  const before = await prisma.order.findUnique({
    where: { id: v.id },
    select: {
      status: true,
      completedAt: true,
      trackingNumber: true,
      trackingCarrier: true,
      orderNumber: true,
      user: { select: { email: true, name: true } },
      shippingAddress: { select: { fullName: true } },
    },
  });
  if (!before) return;

  const statusPatch =
    v.status != null ? orderStatusWriteData(v.status, before.completedAt) : {};

  const updated = await prisma.order.update({
    where: { id: v.id },
    data: {
      ...statusPatch,
      trackingNumber: v.trackingNumber ?? null,
      trackingCarrier: v.trackingCarrier ?? null,
      shippingMethod: v.shippingMethod ?? null,
      adminNote: v.adminNote ?? null,
    },
    select: {
      trackingNumber: true,
      trackingCarrier: true,
      shippingMethod: true,
    },
  });

  const newTracking = (updated.trackingNumber ?? "").trim();
  const newCarrier = (updated.trackingCarrier ?? "").trim();
  const oldTracking = (before.trackingNumber ?? "").trim();
  const oldCarrier = (before.trackingCarrier ?? "").trim();
  const trackingChanged =
    newTracking.length > 0 && (newTracking !== oldTracking || newCarrier !== oldCarrier);

  if (trackingChanged) {
    const to = before.user.email?.trim();
    if (to) {
      const customerName = before.shippingAddress?.fullName ?? before.user.name ?? "there";
      try {
        const { sendOrderShippedEmail } = await import("@/lib/email/send");
        await sendOrderShippedEmail(to, {
          orderNumber: before.orderNumber,
          customerName,
          trackingNumber: newTracking,
          trackingCarrier: newCarrier || "See carrier",
          shippingMethod: updated.shippingMethod,
        });
      } catch (emailErr) {
        console.error("[EMAIL] order-shipped failed", emailErr);
      }
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${v.id}`);
}

// ---- Reviews
export async function setReviewStatusAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ReviewStatus;
  if (!id) return;
  if (!Object.values(ReviewStatus).includes(status)) return;
  const updated = await prisma.review.update({
    where: { id },
    data: { status },
    select: { product: { select: { slug: true } } },
  });
  revalidatePath("/admin/reviews");
  revalidatePath(`/product/${updated.product.slug}`);
}

// ---- Coupon
const couponIn = z.object({
  id: z.string().optional(),
  code: z.string().min(2).max(32),
  description: z.string().max(500).optional(),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().int().min(1),
  minOrderCents: z.coerce.number().int().min(0).optional(),
  maxRedemptions: z.coerce.number().int().min(1).optional(),
  active: z.coerce.boolean().optional(),
});

export async function upsertCouponAction(formData: FormData) {
  await requireStaff();
  const maxRaw = formData.get("maxRedemptions");
  const startsAt = parseOptionalDate(formData.get("startsAt"));
  const endsAt = parseOptionalDate(formData.get("endsAt"));
  if (startsAt === undefined || endsAt === undefined) return;
  const p = couponIn.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    code: formData.get("code"),
    description: String(formData.get("description") ?? "") || undefined,
    type: formData.get("type"),
    value: formData.get("value"),
    minOrderCents: formData.get("minOrderCents") || 0,
    maxRedemptions: maxRaw && String(maxRaw) !== "" ? maxRaw : undefined,
    active: formData.get("active") === "on",
  });
  if (!p.success) return;
  const v = p.data;
  const data = {
    code: v.code.toUpperCase(),
    description: v.description,
    type: v.type,
    value: v.value,
    minOrderCents: v.minOrderCents ?? 0,
    maxRedemptions: v.maxRedemptions,
    startsAt,
    endsAt,
    active: v.active ?? true,
  };
  if (v.id) {
    await prisma.coupon.update({ where: { id: v.id }, data });
  } else {
    await prisma.coupon.create({
      data: {
      code: v.code.toUpperCase(),
      description: v.description,
      type: v.type,
      value: v.value,
      minOrderCents: v.minOrderCents ?? 0,
      maxRedemptions: v.maxRedemptions,
      startsAt,
      endsAt,
      active: v.active ?? true,
      },
    });
  }
  revalidatePath("/admin/coupons");
}

export async function createCouponAction(formData: FormData) {
  return upsertCouponAction(formData);
}

export async function deleteCouponAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/coupons");
}

// ---- Blog
const blogIn = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional(),
  mdx: z.string().min(1).max(100000),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  category: z.string().max(100).optional(),
  heroImageUrl: z.string().max(1000).optional(),
  readMinutes: z.coerce.number().int().min(1).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDesc: z.string().max(500).optional(),
});

export async function upsertBlogPostAction(formData: FormData) {
  const s = await requireStaff();
  const p = blogIn.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: String(formData.get("excerpt") ?? "") || undefined,
    mdx: formData.get("mdx"),
    status: formData.get("status"),
    category: String(formData.get("category") ?? "") || undefined,
    heroImageUrl: String(formData.get("heroImageUrl") ?? "") || undefined,
    readMinutes: formData.get("readMinutes") || undefined,
    seoTitle: String(formData.get("seoTitle") ?? "") || undefined,
    seoDesc: String(formData.get("seoDesc") ?? "") || undefined,
  });
  if (!p.success) return;
  const v = p.data;
  if (v.id) {
    await prisma.blogPost.update({
      where: { id: v.id },
      data: {
        title: v.title,
        slug: v.slug,
        excerpt: v.excerpt,
        mdx: v.mdx,
        status: v.status,
        category: v.category,
        heroImageUrl: v.heroImageUrl,
        readMinutes: v.readMinutes,
        seoTitle: v.seoTitle,
        seoDesc: v.seoDesc,
        publishedAt: v.status === "PUBLISHED" ? new Date() : null,
      },
    });
  } else {
    await prisma.blogPost.create({
      data: {
      title: v.title,
      slug: v.slug,
      excerpt: v.excerpt,
      mdx: v.mdx,
      status: v.status,
      category: v.category,
      heroImageUrl: v.heroImageUrl,
      readMinutes: v.readMinutes,
      seoTitle: v.seoTitle,
      seoDesc: v.seoDesc,
      authorId: s.user.id,
      publishedAt: v.status === "PUBLISHED" ? new Date() : null,
      },
    });
  }
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}

export async function createBlogPostAction(formData: FormData) {
  return upsertBlogPostAction(formData);
}

export async function deleteBlogPostAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}

// ---- Store settings (JSON)
export async function setStoreSettingAction(formData: FormData) {
  await requireStaff();
  const key = String(formData.get("key") ?? "");
  const valueRaw = String(formData.get("value") ?? "");
  if (!key) return;
  let value: object;
  try {
    value = JSON.parse(valueRaw) as object;
  } catch {
    return;
  }
  await prisma.storeSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  revalidatePath("/admin/settings");
}

export async function deleteStoreSettingAction(formData: FormData) {
  await requireStaff();
  const key = String(formData.get("key") ?? "");
  if (!key) return;
  await prisma.storeSetting.delete({ where: { key } });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/seo");
  revalidatePath("/admin/campaigns");
}

// ---- Media
export async function createMediaAction(formData: FormData) {
  await requireStaff();
  const url = z.string().url().safeParse(String(formData.get("url") ?? ""));
  const filename = z.string().min(1).safeParse(String(formData.get("filename") ?? "file"));
  if (!url.success || !filename.success) return;
  await prisma.media.create({
    data: { url: url.data, filename: filename.data, mime: "image/unknown", sizeBytes: 0 },
  });
  revalidatePath("/admin/media");
}

export async function deleteMediaAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.media.delete({ where: { id } });
  revalidatePath("/admin/media");
}

export async function updateProductCategoriesAction(formData: FormData) {
  await requireStaff();
  const productId = String(formData.get("productId") ?? "");
  const slugs = String(formData.get("categorySlugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!productId) return;
  const cats = await prisma.category.findMany({ where: { slug: { in: slugs } } });
  await prisma.$transaction([
    prisma.productCategory.deleteMany({ where: { productId } }),
    ...cats.map((c) => prisma.productCategory.create({ data: { productId, categoryId: c.id } })),
  ]);
  revalidatePath("/admin/products");
}

export async function setContactHandledAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const handled = formData.get("handled") === "on";
  if (!id) return;
  await prisma.contactSubmission.update({ where: { id }, data: { handled } });
  revalidatePath("/admin/contacts");
}

export async function saveEmailAppearanceAction(data: unknown) {
  await requireStaff();
  const appearance = normalizeEmailAppearance(data);
  await persistEmailAppearance(appearance);
  revalidatePath("/admin/emails");
}

const emailTemplateIn = z.object({
  id: z.string().optional(),
  key: z.string().min(2).max(100),
  subject: z.string().min(1).max(200),
  bodyHint: z.string().max(20000).optional(),
  active: z.coerce.boolean().optional(),
});

export async function upsertEmailTemplateAction(formData: FormData) {
  await requireStaff();
  const parsed = emailTemplateIn.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    key: formData.get("key"),
    subject: formData.get("subject"),
    bodyHint: String(formData.get("bodyHint") ?? "") || undefined,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return;
  const v = parsed.data;
  const data = {
    key: v.key,
    subject: v.subject,
    bodyHint: v.bodyHint,
    active: v.active ?? true,
  };
  if (v.id) {
    await prisma.emailTemplate.update({ where: { id: v.id }, data });
  } else {
    await prisma.emailTemplate.create({ data });
  }
  revalidatePath("/admin/emails");
}

export async function deleteEmailTemplateAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.emailTemplate.delete({ where: { id } });
  revalidatePath("/admin/emails");
}
