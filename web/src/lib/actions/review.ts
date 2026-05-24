"use server";

import { revalidatePath } from "next/cache";
import { ReviewStatus } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getProductReviewEligibility } from "@/lib/data/reviews";

export type SubmitReviewState = { error?: string; success?: string } | null;

const schema = z.object({
  productId: z.string().min(1),
  productSlug: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10, "Review must be at least 10 characters.").max(5000),
});

export async function submitProductReviewAction(
  _prev: SubmitReviewState,
  formData: FormData,
): Promise<SubmitReviewState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in to leave a review." };

  const parsed = schema.safeParse({
    productId: String(formData.get("productId") ?? ""),
    productSlug: String(formData.get("productSlug") ?? ""),
    rating: formData.get("rating"),
    title: String(formData.get("title") ?? "").trim() || undefined,
    body: String(formData.get("body") ?? "").trim(),
  });
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.body?.[0] ?? "Please check your review and try again.";
    return { error: msg };
  }

  const { productId, productSlug, rating, title, body } = parsed.data;

  const product = await prisma.product.findFirst({
    where: { id: productId, slug: productSlug },
    select: { id: true },
  });
  if (!product) return { error: "Product not found." };

  const eligibility = await getProductReviewEligibility(session.user.id, productId);
  if (!eligibility.canSubmit) {
    if (eligibility.reason === "already_reviewed") {
      return { error: "You have already submitted a review for this product." };
    }
    if (eligibility.reason === "purchase_required") {
      return { error: "Only customers who purchased this product can leave a review." };
    }
    return { error: "You cannot submit a review for this product." };
  }

  await prisma.review.create({
    data: {
      productId,
      userId: session.user.id,
      rating,
      title,
      body,
      status: ReviewStatus.PENDING,
    },
  });

  revalidatePath(`/product/${productSlug}`);
  revalidatePath("/admin/reviews");

  return {
    success: "Thanks — your review was submitted and will appear after moderation.",
  };
}
