"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ProductStatus, OrderStatus, ReviewStatus } from "@prisma/client";
import { requireStaff } from "@/lib/auth/admin";

// ---- Products
const productIn = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  shortDesc: z.string().min(1).max(500),
  longDesc: z.string().min(1).max(20000),
  priceCents: z.coerce.number().int().min(0),
  status: z.nativeEnum(ProductStatus),
  isBestSeller: z.boolean().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  disclaimer: z.string().max(2000).optional(),
});

export async function upsertProductAction(
  _prev: { error?: string; success?: string; id?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string; id?: string } | null> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const parsed = productIn.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    shortDesc: formData.get("shortDesc"),
    longDesc: formData.get("longDesc"),
    priceCents: formData.get("priceCents"),
    status: formData.get("status"),
    isBestSeller: formData.get("isBestSeller") === "on" ? true : false,
    imageUrl: String(formData.get("imageUrl") ?? ""),
    disclaimer: String(formData.get("disclaimer") ?? "") || undefined,
  });
  if (!parsed.success) return { error: "Invalid" };
  const v = parsed.data;
  if (id) {
    const p = await prisma.product.update({
      where: { id },
      data: {
        name: v.name,
        slug: v.slug,
        shortDesc: v.shortDesc,
        longDesc: v.longDesc,
        priceCents: v.priceCents,
        status: v.status,
        isBestSeller: v.isBestSeller ?? false,
        disclaimer: v.disclaimer,
        ...(v.imageUrl
          ? {
              images: { deleteMany: {}, create: [{ url: v.imageUrl, alt: v.name, sortOrder: 0 }] },
            }
          : {}),
      },
    });
    revalidatePath("/shop");
    revalidatePath("/admin/products");
    revalidatePath(`/product/${p.slug}`);
    return { success: "Saved" };
  }
  const p = await prisma.product.create({
    data: {
      name: v.name,
      slug: v.slug,
      shortDesc: v.shortDesc,
      longDesc: v.longDesc,
      priceCents: v.priceCents,
      status: v.status,
      isBestSeller: v.isBestSeller ?? false,
      disclaimer: v.disclaimer,
      images: v.imageUrl
        ? { create: [{ url: v.imageUrl, alt: v.name, sortOrder: 0 }] }
        : { create: [{ url: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&q=80", alt: v.name, sortOrder: 0 }] },
    },
  });
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  return { success: "Created", id: p.id };
}

// ---- Orders
export async function setOrderStatusAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!id || !Object.values(OrderStatus).includes(status)) return;
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/orders");
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
  code: z.string().min(2).max(32),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().int().min(1),
  minOrderCents: z.coerce.number().int().min(0).optional(),
  maxRedemptions: z.coerce.number().int().min(1).optional(),
  active: z.coerce.boolean().optional(),
});

export async function createCouponAction(formData: FormData) {
  await requireStaff();
  const maxRaw = formData.get("maxRedemptions");
  const p = couponIn.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    minOrderCents: formData.get("minOrderCents") || 0,
    maxRedemptions: maxRaw && String(maxRaw) !== "" ? maxRaw : undefined,
    active: formData.get("active") === "on",
  });
  if (!p.success) return;
  const v = p.data;
  await prisma.coupon.create({
    data: {
      code: v.code.toUpperCase(),
      type: v.type,
      value: v.value,
      minOrderCents: v.minOrderCents ?? 0,
      maxRedemptions: v.maxRedemptions,
      active: v.active ?? true,
    },
  });
  revalidatePath("/admin/coupons");
}

// ---- Blog
const blogIn = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional(),
  mdx: z.string().min(1).max(100000),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export async function createBlogPostAction(formData: FormData) {
  const s = await requireStaff();
  const p = blogIn.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: String(formData.get("excerpt") ?? "") || undefined,
    mdx: formData.get("mdx"),
    status: formData.get("status"),
  });
  if (!p.success) return;
  const v = p.data;
  await prisma.blogPost.create({
    data: {
      title: v.title,
      slug: v.slug,
      excerpt: v.excerpt,
      mdx: v.mdx,
      status: v.status,
      authorId: s.user.id,
      publishedAt: v.status === "PUBLISHED" ? new Date() : null,
    },
  });
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
