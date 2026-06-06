"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma, ProductStatus, OrderStatus, ReviewStatus } from "@prisma/client";
import { requireStaff } from "@/lib/auth/admin";
import { recordAdminAudit } from "@/lib/admin/audit-log";
import { revalidateStorefrontForBlog, revalidateStorefrontForProduct } from "@/lib/storefront-revalidate";
import { normalizeEmailAppearance } from "@/lib/email/email-appearance";
import { persistEmailAppearance } from "@/lib/email/appearance-store";
import { orderDeleteBlockedReason } from "@/lib/admin/order-delete";
import { validateProductPublishReadiness } from "@/lib/admin/product-publish-readiness";
import { orderStatusWriteData, shouldIncrementCouponRedemption } from "@/lib/domain/order-completion";
import { syncProductVariants } from "@/lib/catalog/product-variant-store";
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
  purity: z.string().max(120).optional(),
  testingStatus: z.string().max(200).optional(),
  coaUrl: z.string().max(500).optional(),
  storageNotes: z.string().max(2000).optional(),
  shippingRestrictions: z.string().max(2000).optional(),
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
  featuredAltRaw: string,
  galleryAltText: string,
): { ok: true; rows: { url: string; alt: string; explicitAlt: boolean; sortOrder: number }[] } | { ok: false; error: string } {
  const featured = featuredRaw.trim();
  if (!featured) return { ok: false, error: "Add a featured product image URL (HTTPS)." };
  const f = httpsImageUrl.safeParse(featured);
  if (!f.success) return { ok: false, error: "Featured image must be a valid HTTPS URL." };
  const featuredAlt = featuredAltRaw.trim();
  const rows: { url: string; alt: string; explicitAlt: boolean; sortOrder: number }[] = [
    { url: featured, alt: featuredAlt || productName, explicitAlt: Boolean(featuredAlt), sortOrder: 0 },
  ];
  const galleryAlts = galleryAltText.split(/\r?\n/).map((line) => line.trim());
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
    const galleryAlt = galleryAlts[order - 1] ?? "";
    rows.push({ url: line, alt: galleryAlt || productName, explicitAlt: Boolean(galleryAlt), sortOrder: order++ });
  }
  return { ok: true, rows };
}

export async function upsertProductAction(
  _prev: { error?: string; success?: string; id?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string; id?: string } | null> {
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const productType = String(formData.get("productType") ?? "simple").toLowerCase() === "variable" ? "variable" : "simple";
  const beforeProduct =
    id ?
      await prisma.product.findUnique({
        where: { id },
        select: { name: true, slug: true, status: true, priceCents: true },
      })
    : null;

  const parsedBase = productBaseIn.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    shortDesc: formData.get("shortDesc"),
    longDesc: formData.get("longDesc"),
    status: formData.get("status"),
    isBestSeller: formData.get("isBestSeller") === "on" ? true : false,
    disclaimer: String(formData.get("disclaimer") ?? "") || undefined,
    purity: String(formData.get("purity") ?? "") || undefined,
    testingStatus: String(formData.get("testingStatus") ?? "") || undefined,
    coaUrl: String(formData.get("coaUrl") ?? "") || undefined,
    storageNotes: String(formData.get("storageNotes") ?? "") || undefined,
    shippingRestrictions: String(formData.get("shippingRestrictions") ?? "") || undefined,
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
  const featuredImageAlt = String(formData.get("featuredImageAlt") ?? "");
  const galleryUrls = String(formData.get("galleryUrls") ?? "");
  const galleryAlts = String(formData.get("galleryAlts") ?? "");
  const imgs = collectHttpsProductImages(b.name, featuredImage, galleryUrls, featuredImageAlt, galleryAlts);
  if (!imgs.ok) return { error: imgs.error };

  const categorySlugs = formData.getAll("categories").map((v) => String(v).trim()).filter(Boolean);
  const tierCountPreview =
    productType === "variable"
      ? parseVariantTiers(
          (() => {
            const rawJson = String(formData.get("variantsJson") ?? "").trim();
            const parsed = parseOptionalJson(rawJson);
            return parsed.ok ? parsed.value : null;
          })(),
        ).length
      : 1;

  const publishError = validateProductPublishReadiness({
    status: b.status,
    seoTitle: b.seoTitle,
    seoDesc: b.seoDesc,
    disclaimer: b.disclaimer,
    coaUrl: b.coaUrl,
    categorySlugs,
    featuredImageUrl: featuredImage,
    featuredImageAlt,
    galleryUrls,
    galleryAlts,
    productType,
    tierCount: tierCountPreview,
  });
  if (publishError) return { error: publishError };

  const specificationsRaw = String(formData.get("specificationsJson") ?? "").trim();
  const specifications = parseOptionalJson(specificationsRaw);
  if (!specifications.ok) return { error: "Specifications JSON is invalid." };

  let priceCents: number;
  let compareAtCents: number | null = null;
  let tiersForSync: ReturnType<typeof parseVariantTiers>;

  if (productType === "variable") {
    const rawJson = String(formData.get("variantsJson") ?? "").trim();
    if (!rawJson) return { error: "Variable products need at least two pricing tiers." };
    const variants = parseOptionalJson(rawJson);
    if (!variants.ok) return { error: "Variant tiers JSON is invalid." };
    const tiers = parseVariantTiers(variants.value);
    if (tiers.length < 2) {
      return { error: "Variable products need at least two pricing tiers (or switch to Simple product type)." };
    }
    tiersForSync = tiers;
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
    tiersForSync = [{ label: b.name, priceCents, compareAtCents: compareAtCents ?? undefined }];
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
    purity: b.purity,
    testingStatus: b.testingStatus,
    coaUrl: b.coaUrl,
    storageNotes: b.storageNotes,
    specifications: specifications.value,
    shippingRestrictions: b.shippingRestrictions,
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
        await syncProductVariants(tx, {
          productId: row.id,
          productSlug: row.slug,
          productName: row.name,
          priceCents: row.priceCents,
          compareAtCents: row.compareAtCents,
          tiers: tiersForSync,
        });
        return row;
      });
      revalidateStorefrontForProduct(p.slug, categorySlugs);
      revalidatePath("/admin/products");
      await recordAdminAudit({
        actorId: staff.user.id,
        actorEmail: staff.user.email,
        action: "product.update",
        entityType: "product",
        entityId: p.id,
        summary: `Updated product ${p.name}`,
        changes: {
          before: beforeProduct,
          after: { name: p.name, slug: p.slug, status: p.status, priceCents: p.priceCents },
        },
      });
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
      await syncProductVariants(tx, {
        productId: row.id,
        productSlug: row.slug,
        productName: row.name,
        priceCents: row.priceCents,
        compareAtCents: row.compareAtCents,
        tiers: tiersForSync,
      });
      return row;
    });
    revalidateStorefrontForProduct(p.slug, categorySlugs);
    revalidatePath("/admin/products");
    await recordAdminAudit({
      actorId: staff.user.id,
      actorEmail: staff.user.email,
      action: "product.create",
      entityType: "product",
      entityId: p.id,
      summary: `Created product ${p.name}`,
      changes: { slug: p.slug, status: p.status, priceCents: p.priceCents },
    });
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
    select: { completedAt: true, couponId: true },
  });
  if (!existing) return;
  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: orderStatusWriteData(status, existing?.completedAt),
    }),
    ...(shouldIncrementCouponRedemption(status, existing?.completedAt, existing?.couponId)
      ? [
          prisma.coupon.update({
            where: { id: existing.couponId },
            data: { redemptionCount: { increment: 1 } },
          }),
        ]
      : []),
  ]);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function bulkSetOrderStatusAction(formData: FormData) {
  const staff = await requireStaff();
  const ids = formData.getAll("orderIds").map(String).filter(Boolean);
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!ids.length) redirect("/admin/orders?notice=bulk_none");
  if (!Object.values(OrderStatus).includes(status)) redirect("/admin/orders?notice=bulk_status_invalid");

  let updated = 0;
  for (const id of ids) {
    const existing = await prisma.order.findUnique({
      where: { id },
      select: { completedAt: true, couponId: true, orderNumber: true, status: true },
    });
    if (!existing || existing.status === status) continue;
    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: orderStatusWriteData(status, existing.completedAt),
      }),
      ...(shouldIncrementCouponRedemption(status, existing.completedAt, existing.couponId)
        ? [
            prisma.coupon.update({
              where: { id: existing.couponId },
              data: { redemptionCount: { increment: 1 } },
            }),
          ]
        : []),
    ]);
    await recordAdminAudit({
      actorId: staff.user.id,
      actorEmail: staff.user.email,
      action: "order.update",
      entityType: "order",
      entityId: id,
      summary: `Bulk status update for order ${existing.orderNumber}`,
      changes: { status: { from: existing.status, to: status }, bulk: true },
    });
    updated++;
  }

  revalidatePath("/admin/orders");
  if (updated === 0) redirect("/admin/orders?notice=bulk_status_none");
  redirect(`/admin/orders?notice=bulk_status_updated&count=${updated}`);
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
  const staff = await requireStaff();
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
      couponId: true,
      trackingNumber: true,
      trackingCarrier: true,
      adminNote: true,
      orderNumber: true,
      user: { select: { email: true, name: true } },
      shippingAddress: { select: { fullName: true } },
    },
  });
  if (!before) return;

  const statusPatch =
    v.status != null ? orderStatusWriteData(v.status, before.completedAt) : {};

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
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
    if (v.status != null && shouldIncrementCouponRedemption(v.status, before.completedAt, before.couponId)) {
      await tx.coupon.update({
        where: { id: before.couponId },
        data: { redemptionCount: { increment: 1 } },
      });
    }
    return order;
  });

  const newTracking = (updated.trackingNumber ?? "").trim();
  const newCarrier = (updated.trackingCarrier ?? "").trim();
  const oldTracking = (before.trackingNumber ?? "").trim();
  const oldCarrier = (before.trackingCarrier ?? "").trim();
  const trackingChanged =
    newTracking.length > 0 && (newTracking !== oldTracking || newCarrier !== oldCarrier);

  const auditChanges: Record<string, unknown> = {};
  if (v.status != null && v.status !== before.status) auditChanges.status = { from: before.status, to: v.status };
  if ((v.trackingNumber ?? null) !== (before.trackingNumber ?? null)) {
    auditChanges.trackingNumber = { from: before.trackingNumber, to: v.trackingNumber };
  }
  if ((v.trackingCarrier ?? null) !== (before.trackingCarrier ?? null)) {
    auditChanges.trackingCarrier = { from: before.trackingCarrier, to: v.trackingCarrier };
  }
  if (Object.keys(auditChanges).length > 0 || (v.adminNote ?? null) !== (before.adminNote ?? null)) {
    await recordAdminAudit({
      actorId: staff.user.id,
      actorEmail: staff.user.email,
      action: "order.update",
      entityType: "order",
      entityId: v.id,
      summary: `Updated order ${before.orderNumber}`,
      changes: auditChanges as Prisma.InputJsonValue,
    });
  }

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

const orderDeleteSelect = {
  id: true,
  orderNumber: true,
  status: true,
  completedAt: true,
  payments: { select: { status: true } },
} as const;

function safeAdminOrderReturnTo(raw: string): string {
  const trimmed = raw.trim() || "/admin/orders";
  if (!trimmed.startsWith("/admin") || trimmed.startsWith("//")) return "/admin/orders";
  return trimmed;
}

export async function deleteOrderAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const returnTo = safeAdminOrderReturnTo(String(formData.get("returnTo") ?? "/admin/orders"));
  if (!id) redirect(`${returnTo}?notice=order_not_found`);

  const order = await prisma.order.findUnique({
    where: { id },
    select: orderDeleteSelect,
  });
  if (!order) redirect(`${returnTo}?notice=order_not_found`);

  const blocked = orderDeleteBlockedReason(order);
  if (blocked) redirect(`${returnTo}?notice=order_blocked`);

  await prisma.order.delete({ where: { id } });
  await recordAdminAudit({
    actorId: staff.user.id,
    actorEmail: staff.user.email,
    action: "order.delete",
    entityType: "order",
    entityId: id,
    summary: `Deleted order ${order.orderNumber}`,
    changes: { status: order.status, orderNumber: order.orderNumber },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(returnTo === `/admin/orders/${id}` ? "/admin/orders?notice=order_deleted" : `${returnTo}?notice=order_deleted`);
}

export async function bulkDeleteOrdersAction(formData: FormData) {
  const staff = await requireStaff();
  const ids = formData.getAll("orderIds").map(String).filter(Boolean);
  if (!ids.length) redirect("/admin/orders?notice=bulk_none");

  let deleted = 0;
  let blocked = 0;
  for (const id of ids) {
    const order = await prisma.order.findUnique({
      where: { id },
      select: orderDeleteSelect,
    });
    if (!order) continue;
    if (orderDeleteBlockedReason(order)) {
      blocked++;
      continue;
    }
    await prisma.order.delete({ where: { id } });
    await recordAdminAudit({
      actorId: staff.user.id,
      actorEmail: staff.user.email,
      action: "order.delete",
      entityType: "order",
      entityId: id,
      summary: `Deleted order ${order.orderNumber}`,
      changes: { status: order.status, orderNumber: order.orderNumber, bulk: true },
    });
    deleted++;
  }

  revalidatePath("/admin/orders");
  if (blocked > 0 && deleted === 0) redirect("/admin/orders?notice=bulk_all_blocked");
  if (blocked > 0) redirect(`/admin/orders?notice=bulk_partial&deleted=${deleted}&blocked=${blocked}`);
  redirect(`/admin/orders?notice=bulk_deleted&count=${deleted}`);
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

function parseCouponIdJsonList(raw: FormDataEntryValue | null, max = 500): string[] {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  try {
    const arr = JSON.parse(s) as unknown;
    if (!Array.isArray(arr)) return [];
    const ids = arr.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, max);
    return ids;
  } catch {
    return [];
  }
}

// ---- Coupon
const couponIn = z
  .object({
    id: z.string().optional(),
    code: z.string().min(2).max(32),
    description: z.string().max(500).optional(),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().int().min(0),
    minOrderCents: z.coerce.number().int().min(0).optional(),
    maxOrderCents: z.coerce.number().int().min(0).optional(),
    maxRedemptions: z.coerce.number().int().min(1).optional(),
    usageLimitPerUser: z.coerce.number().int().min(1).optional(),
    freeShipping: z.coerce.boolean().optional(),
    excludeSaleItems: z.coerce.boolean().optional(),
    allowedEmails: z.string().max(8000).optional(),
    active: z.coerce.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PERCENT" && data.value > 100) {
      ctx.addIssue({ code: "custom", message: "Percentage must be between 0 and 100.", path: ["value"] });
    }
    if (data.value === 0 && data.freeShipping !== true) {
      ctx.addIssue({
        code: "custom",
        message: "Set a discount value or enable free shipping.",
        path: ["value"],
      });
    }
    const minO = data.minOrderCents ?? 0;
    const maxO = data.maxOrderCents;
    if (maxO != null && maxO < minO) {
      ctx.addIssue({
        code: "custom",
        message: "Maximum spend must be greater than or equal to minimum spend.",
        path: ["maxOrderCents"],
      });
    }
  });

export async function upsertCouponAction(
  _prev: { error?: string; success?: string; id?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string; id?: string } | null> {
  const staff = await requireStaff();
  const maxRaw = formData.get("maxRedemptions");
  const usagePerUserRaw = formData.get("usageLimitPerUser");
  const startsAtRaw = parseOptionalDate(formData.get("startsAt"));
  const endsAtRaw = parseOptionalDate(formData.get("endsAt"));
  if (startsAtRaw === undefined || endsAtRaw === undefined) {
    return { error: "Invalid start or end date." };
  }

  const p = couponIn.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    code: formData.get("code"),
    description: String(formData.get("description") ?? "") || undefined,
    type: formData.get("type"),
    value: formData.get("value"),
    minOrderCents: formData.get("minOrderCents") || 0,
    maxOrderCents:
      formData.get("maxOrderCents") != null && String(formData.get("maxOrderCents")).trim() !== ""
        ? formData.get("maxOrderCents")
        : undefined,
    maxRedemptions: maxRaw && String(maxRaw) !== "" ? maxRaw : undefined,
    usageLimitPerUser: usagePerUserRaw && String(usagePerUserRaw) !== "" ? usagePerUserRaw : undefined,
    freeShipping: formData.get("freeShipping") === "on",
    excludeSaleItems: formData.get("excludeSaleItems") === "on",
    allowedEmails: String(formData.get("allowedEmails") ?? "").trim() || undefined,
    active: formData.get("active") === "on",
  });
  if (!p.success) {
    const msg = p.error.flatten().formErrors[0] ?? p.error.issues[0]?.message ?? "Invalid coupon data.";
    return { error: msg };
  }
  const v = p.data;

  const includeProductIds = parseCouponIdJsonList(formData.get("includeProductIds"));
  const excludeProductIds = parseCouponIdJsonList(formData.get("excludeProductIds"));
  const includeCategoryIds = parseCouponIdJsonList(formData.get("includeCategoryIds"));
  const excludeCategoryIds = parseCouponIdJsonList(formData.get("excludeCategoryIds"));

  const allProductIds = [...new Set([...includeProductIds, ...excludeProductIds])];
  const allCategoryIds = [...new Set([...includeCategoryIds, ...excludeCategoryIds])];
  if (allProductIds.length) {
    const n = await prisma.product.count({ where: { id: { in: allProductIds } } });
    if (n !== allProductIds.length) return { error: "One or more product IDs are invalid." };
  }
  if (allCategoryIds.length) {
    const n = await prisma.category.count({ where: { id: { in: allCategoryIds } } });
    if (n !== allCategoryIds.length) return { error: "One or more category IDs are invalid." };
  }

  const baseData = {
    code: v.code.toUpperCase(),
    description: v.description,
    type: v.type,
    value: v.value,
    minOrderCents: v.minOrderCents ?? 0,
    maxOrderCents: v.maxOrderCents ?? null,
    maxRedemptions: v.maxRedemptions,
    usageLimitPerUser: v.usageLimitPerUser ?? null,
    startsAt: startsAtRaw,
    endsAt: endsAtRaw,
    active: v.active ?? true,
    freeShipping: v.freeShipping ?? false,
    excludeSaleItems: v.excludeSaleItems ?? false,
    allowedEmails: v.allowedEmails?.trim() ? v.allowedEmails.trim() : null,
  };

  const syncJoins = async (couponId: string, tx: Prisma.TransactionClient) => {
    await tx.couponProductInclude.deleteMany({ where: { couponId } });
    await tx.couponProductExclude.deleteMany({ where: { couponId } });
    await tx.couponCategoryInclude.deleteMany({ where: { couponId } });
    await tx.couponCategoryExclude.deleteMany({ where: { couponId } });
    if (includeProductIds.length) {
      await tx.couponProductInclude.createMany({
        data: includeProductIds.map((productId) => ({ couponId, productId })),
        skipDuplicates: true,
      });
    }
    if (excludeProductIds.length) {
      await tx.couponProductExclude.createMany({
        data: excludeProductIds.map((productId) => ({ couponId, productId })),
        skipDuplicates: true,
      });
    }
    if (includeCategoryIds.length) {
      await tx.couponCategoryInclude.createMany({
        data: includeCategoryIds.map((categoryId) => ({ couponId, categoryId })),
        skipDuplicates: true,
      });
    }
    if (excludeCategoryIds.length) {
      await tx.couponCategoryExclude.createMany({
        data: excludeCategoryIds.map((categoryId) => ({ couponId, categoryId })),
        skipDuplicates: true,
      });
    }
  };

  const beforeCoupon =
    v.id ?
      await prisma.coupon.findUnique({
        where: { id: v.id },
        select: { code: true, type: true, value: true, active: true },
      })
    : null;

  try {
    if (v.id) {
      const couponId = v.id;
      await prisma.$transaction(async (tx) => {
        await tx.coupon.update({ where: { id: couponId }, data: baseData });
        await syncJoins(couponId, tx);
      });
      revalidatePath("/admin/coupons");
      revalidatePath(`/admin/coupons/${couponId}`);
      await recordAdminAudit({
        actorId: staff.user.id,
        actorEmail: staff.user.email,
        action: "coupon.update",
        entityType: "coupon",
        entityId: couponId,
        summary: `Updated coupon ${baseData.code}`,
        changes: {
          before: beforeCoupon,
          after: { code: baseData.code, type: baseData.type, value: baseData.value, active: baseData.active },
        },
      });
      return { success: "Saved.", id: couponId };
    }

    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.coupon.create({ data: baseData, select: { id: true } });
      await syncJoins(row.id, tx);
      return row;
    });
    revalidatePath("/admin/coupons");
    revalidatePath(`/admin/coupons/${created.id}`);
    await recordAdminAudit({
      actorId: staff.user.id,
      actorEmail: staff.user.email,
      action: "coupon.create",
      entityType: "coupon",
      entityId: created.id,
      summary: `Created coupon ${baseData.code}`,
      changes: { code: baseData.code, type: baseData.type, value: baseData.value, active: baseData.active },
    });
    return { success: "Created.", id: created.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not save coupon.";
    if (/Unique constraint/i.test(msg)) return { error: "That coupon code is already in use." };
    return { error: msg };
  }
}

export async function createCouponAction(
  _prev: { error?: string; success?: string; id?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string; id?: string } | null> {
  return upsertCouponAction(_prev, formData);
}

export async function deleteCouponAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const c = await prisma.coupon.findUnique({
    where: { id },
    select: { code: true, redemptionCount: true, _count: { select: { orders: true } } },
  });
  if (!c) return;
  if (c.redemptionCount > 0 || c._count.orders > 0) {
    redirect("/admin/coupons?notice=coupon_in_use");
  }
  await prisma.coupon.delete({ where: { id } });
  await recordAdminAudit({
    actorId: staff.user.id,
    actorEmail: staff.user.email,
    action: "coupon.delete",
    entityType: "coupon",
    entityId: id,
    summary: `Deleted coupon ${c.code}`,
    changes: { code: c.code },
  });
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons?notice=coupon_deleted");
}

export async function bulkDeleteCouponsAction(formData: FormData) {
  const staff = await requireStaff();
  const ids = formData.getAll("couponIds").map(String).filter(Boolean);
  if (!ids.length) redirect("/admin/coupons?notice=bulk_none");
  let deleted = 0;
  let blocked = 0;
  for (const id of ids) {
    const c = await prisma.coupon.findUnique({
      where: { id },
      select: { code: true, redemptionCount: true, _count: { select: { orders: true } } },
    });
    if (!c) continue;
    if (c.redemptionCount > 0 || c._count.orders > 0) {
      blocked++;
      continue;
    }
    await prisma.coupon.delete({ where: { id } });
    await recordAdminAudit({
      actorId: staff.user.id,
      actorEmail: staff.user.email,
      action: "coupon.delete",
      entityType: "coupon",
      entityId: id,
      summary: `Deleted coupon ${c.code}`,
      changes: { code: c.code, bulk: true },
    });
    deleted++;
  }
  revalidatePath("/admin/coupons");
  if (blocked > 0 && deleted === 0) redirect("/admin/coupons?notice=bulk_all_in_use");
  if (blocked > 0) redirect(`/admin/coupons?notice=bulk_partial&deleted=${deleted}&blocked=${blocked}`);
  redirect(`/admin/coupons?notice=bulk_deleted&count=${deleted}`);
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

function validateBlogPublishReadiness(post: {
  status: "DRAFT" | "PUBLISHED";
  slug: string;
  seoTitle?: string;
  seoDesc?: string;
}) {
  if (post.status !== "PUBLISHED") return null;
  const errors: string[] = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug.trim())) {
    errors.push("use a lowercase hyphenated slug");
  }
  if (!post.seoTitle?.trim()) errors.push("add an SEO title");
  if (!post.seoDesc?.trim()) errors.push("add a meta description");
  return errors.length > 0 ? `To publish this post, ${errors.join(", ")}.` : null;
}

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
    readMinutes: (() => {
      const raw = String(formData.get("readMinutes") ?? "").trim();
      return raw ? raw : undefined;
    })(),
    seoTitle: String(formData.get("seoTitle") ?? "") || undefined,
    seoDesc: String(formData.get("seoDesc") ?? "") || undefined,
  });
  const id = String(formData.get("id") ?? "") || undefined;
  if (!p.success) {
    redirect(id ? `/admin/blog/${id}?notice=error` : "/admin/blog/new?notice=error");
  }
  const v = p.data;
  const publishError = validateBlogPublishReadiness(v);
  if (publishError) {
    redirect(id ? `/admin/blog/${id}?notice=publish_blocked` : "/admin/blog/new?notice=publish_blocked");
  }
  if (v.id) {
    const existing = await prisma.blogPost.findUnique({
      where: { id: v.id },
      select: { publishedAt: true, slug: true },
    });
    if (!existing) redirect("/admin/blog?notice=error");

    const publishedAt = v.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : null;

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
        publishedAt,
      },
    });
    revalidateStorefrontForBlog(v.slug);
    if (existing.slug !== v.slug) revalidatePath(`/blog/${existing.slug}`);
    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${v.id}`);
    redirect(`/admin/blog/${v.id}?notice=saved`);
  }
  const created = await prisma.blogPost.create({
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
  if (v.status === "PUBLISHED") revalidateStorefrontForBlog(v.slug);
  else revalidatePath("/blog");
  revalidatePath("/admin/blog");
  redirect(`/admin/blog/${created.id}?notice=created`);
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
  redirect("/admin/blog?notice=deleted");
}

// ---- Store settings (JSON)
export async function setStoreSettingAction(formData: FormData) {
  const staff = await requireStaff();
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
  await recordAdminAudit({
    actorId: staff.user.id,
    actorEmail: staff.user.email,
    action: "settings.update",
    entityType: "store_setting",
    entityId: key,
    summary: `Updated store setting ${key}`,
    changes: { key },
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
  revalidatePath("/admin/social-proof");
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
  const staff = await requireStaff();
  const appearance = normalizeEmailAppearance(data);
  await persistEmailAppearance(appearance);
  await recordAdminAudit({
    actorId: staff.user.id,
    actorEmail: staff.user.email,
    action: "email_appearance.update",
    entityType: "email_appearance",
    summary: "Updated email appearance settings",
    changes: { accentColor: appearance.accentColor },
  });
  revalidatePath("/admin/emails");
}

export async function saveEmailSettingsAction(input: { appearance: unknown; content: unknown }) {
  const staff = await requireStaff();
  const { normalizeEmailContentSettings } = await import("@/lib/email/email-content");
  const { persistEmailContent } = await import("@/lib/email/email-content-store");
  const appearance = normalizeEmailAppearance(input.appearance);
  const content = normalizeEmailContentSettings(input.content);
  await Promise.all([persistEmailAppearance(appearance), persistEmailContent(content)]);
  await recordAdminAudit({
    actorId: staff.user.id,
    actorEmail: staff.user.email,
    action: "email_settings.update",
    entityType: "email_settings",
    summary: "Updated email appearance and content settings",
    changes: { accentColor: appearance.accentColor },
  });
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
  const staff = await requireStaff();
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
    await recordAdminAudit({
      actorId: staff.user.id,
      actorEmail: staff.user.email,
      action: "email_template.update",
      entityType: "email_template",
      entityId: v.id,
      summary: `Updated email template ${v.key}`,
      changes: { key: v.key, subject: v.subject, active: data.active },
    });
  } else {
    const created = await prisma.emailTemplate.create({ data });
    await recordAdminAudit({
      actorId: staff.user.id,
      actorEmail: staff.user.email,
      action: "email_template.create",
      entityType: "email_template",
      entityId: created.id,
      summary: `Created email template ${v.key}`,
      changes: { key: v.key, subject: v.subject, active: data.active },
    });
  }
  revalidatePath("/admin/emails");
}

export async function deleteEmailTemplateAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const template = await prisma.emailTemplate.findUnique({
    where: { id },
    select: { key: true, subject: true },
  });
  if (!template) return;
  await prisma.emailTemplate.delete({ where: { id } });
  await recordAdminAudit({
    actorId: staff.user.id,
    actorEmail: staff.user.email,
    action: "email_template.delete",
    entityType: "email_template",
    entityId: id,
    summary: `Deleted email template ${template.key}`,
    changes: { key: template.key, subject: template.subject },
  });
  revalidatePath("/admin/emails");
}
