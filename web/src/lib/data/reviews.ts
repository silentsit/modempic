import { OrderStatus, ReviewStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";

export type ProductReviewEligibility = {
  isSignedIn: boolean;
  canSubmit: boolean;
  canUseCustomName?: boolean;
  reason?: "sign_in" | "purchase_required" | "already_reviewed";
  existingStatus?: ReviewStatus;
};

export async function getProductReviewEligibility(
  userId: string | undefined,
  productId: string,
  userRole?: Role,
): Promise<ProductReviewEligibility> {
  if (!userId) {
    return { isSignedIn: false, canSubmit: false, reason: "sign_in" };
  }

  if (userRole === Role.ADMIN) {
    return { isSignedIn: true, canSubmit: true, canUseCustomName: true };
  }

  return prismaDevOr(
    "getProductReviewEligibility",
    async () => {
      const existing = await prisma.review.findFirst({
        where: { userId, productId },
        select: { status: true },
      });
      if (existing) {
        return {
          isSignedIn: true,
          canSubmit: false,
          reason: "already_reviewed" as const,
          existingStatus: existing.status,
        };
      }

      const purchased = await prisma.orderLine.findFirst({
        where: {
          productId,
          order: { userId, status: OrderStatus.COMPLETED },
        },
        select: { id: true },
      });

      if (!purchased) {
        return { isSignedIn: true, canSubmit: false, reason: "purchase_required" };
      }

      return { isSignedIn: true, canSubmit: true };
    },
    { isSignedIn: true, canSubmit: false, reason: "purchase_required" as const },
  );
}
