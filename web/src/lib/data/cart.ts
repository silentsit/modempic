import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";
import { cartWhere, mergeGuestCartIntoUser, resolveCartOwner } from "@/lib/cart/owner";

export async function getCartCount(): Promise<number> {
  return prismaDevOr(
    "getCartCount",
    async () => {
      const session = await auth();
      if (session?.user?.id) {
        await mergeGuestCartIntoUser(session.user.id);
      }
      const owner = await resolveCartOwner();
      if (!owner) return 0;
      const cart = await prisma.cart.findUnique({
        where: cartWhere(owner),
        include: { items: true },
      });
      if (!cart) return 0;
      return cart.items.reduce((sum, line) => sum + line.quantity, 0);
    },
    0,
  );
}

export async function getCartForUser(userId: string) {
  return prismaDevOr(
    "getCartForUser",
    () =>
      prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              variant: true,
              product: {
                include: {
                  productVariants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
                  images: { orderBy: { sortOrder: "asc" }, take: 1 },
                  categories: { include: { category: true } },
                },
              },
            },
          },
        },
      }),
    null,
  );
}

export async function getCartForOwner() {
  return prismaDevOr(
    "getCartForOwner",
    async () => {
      const session = await auth();
      if (session?.user?.id) {
        await mergeGuestCartIntoUser(session.user.id);
      }
      const owner = await resolveCartOwner();
      if (!owner) return null;
      return prisma.cart.findUnique({
        where: cartWhere(owner),
        include: {
          items: {
            include: {
              variant: true,
              product: {
                include: {
                  productVariants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
                  images: { orderBy: { sortOrder: "asc" }, take: 1 },
                  categories: { include: { category: true } },
                },
              },
            },
          },
        },
      });
    },
    null,
  );
}
