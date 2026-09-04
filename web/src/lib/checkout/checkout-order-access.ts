import { auth } from "@/auth";
import { guestCanAccessOrder } from "@/lib/cart/owner";
import { prisma } from "@/lib/db";

const accessibleOrderInclude = {
  user: { select: { email: true } },
  lines: {
    include: {
      product: { select: { paymentCode: true } },
    },
  },
  payments: { orderBy: { createdAt: "desc" as const } },
};

export async function loadAccessibleCheckoutOrder(orderNumber: string) {
  const normalized = orderNumber.trim().toUpperCase();
  if (!normalized) return null;

  const session = await auth();
  const guestAccess = await guestCanAccessOrder(normalized);
  if (!session?.user?.id && !guestAccess) return null;

  return prisma.order.findFirst({
    where: session?.user?.id ? { orderNumber: normalized, userId: session.user.id } : { orderNumber: normalized },
    include: accessibleOrderInclude,
  });
}

export type AccessibleCheckoutOrder = NonNullable<Awaited<ReturnType<typeof loadAccessibleCheckoutOrder>>>;
