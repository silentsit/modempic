import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { prismaDevOr } from "@/lib/data/prisma-fallback";

export async function getCartCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;
  return prismaDevOr("getCartCount", async () => {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });
    if (!cart) return 0;
    return cart.items.reduce((sum, line) => sum + line.quantity, 0);
  }, 0);
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
              product: {
                include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
              },
            },
          },
        },
      }),
    null,
  );
}
