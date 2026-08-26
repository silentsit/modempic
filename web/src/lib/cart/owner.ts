import { cookies, headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  GUEST_CART_COOKIE,
  GUEST_ORDER_COOKIE,
  appendGuestOrderNumber,
  guestCartCookieOptions,
  isGuestCartKey,
  parseGuestOrderNumbers,
} from "@/lib/cart/guest-cookie";

export type CartOwner = { userId: string } | { guestKey: string };

function cookieSecure() {
  return process.env.NODE_ENV === "production";
}

export async function readGuestCartKey(): Promise<string | null> {
  const jar = await cookies();
  const fromCookie = jar.get(GUEST_CART_COOKIE)?.value;
  if (isGuestCartKey(fromCookie)) return fromCookie;
  const fromHeader = (await headers()).get("x-guest-cart-key");
  return isGuestCartKey(fromHeader) ? fromHeader : null;
}

export async function ensureGuestCartKey(): Promise<string> {
  const existing = await readGuestCartKey();
  if (existing) return existing;
  const guestKey = crypto.randomUUID();
  const jar = await cookies();
  jar.set(GUEST_CART_COOKIE, guestKey, guestCartCookieOptions(cookieSecure()));
  return guestKey;
}

export async function resolveCartOwner(): Promise<CartOwner | null> {
  const session = await auth();
  if (session?.user?.id) return { userId: session.user.id };
  const guestKey = await readGuestCartKey();
  if (!guestKey) return null;
  return { guestKey };
}

export async function requireCartOwner(): Promise<CartOwner> {
  const session = await auth();
  if (session?.user?.id) return { userId: session.user.id };
  return { guestKey: await ensureGuestCartKey() };
}

export function cartWhere(owner: CartOwner) {
  return "userId" in owner ? { userId: owner.userId } : { guestKey: owner.guestKey };
}

export async function ensureCartRecord(owner: CartOwner) {
  if ("userId" in owner) {
    return prisma.cart.upsert({
      where: { userId: owner.userId },
      create: { userId: owner.userId },
      update: {},
    });
  }
  return prisma.cart.upsert({
    where: { guestKey: owner.guestKey },
    create: { guestKey: owner.guestKey },
    update: {},
  });
}

export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  const guestKey = await readGuestCartKey();
  if (!guestKey) return;

  const guestCart = await prisma.cart.findUnique({
    where: { guestKey },
    include: { items: true },
  });
  if (!guestCart || guestCart.userId === userId) return;

  const userCart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  if (guestCart.id === userCart.id) {
    await prisma.cart.update({
      where: { id: guestCart.id },
      data: { guestKey: null },
    });
    return;
  }

  for (const line of guestCart.items) {
    const existing = await prisma.cartLine.findUnique({
      where: {
        cartId_productId_variantKey: {
          cartId: userCart.id,
          productId: line.productId,
          variantKey: line.variantKey,
        },
      },
    });
    if (existing) {
      await prisma.cartLine.update({
        where: { id: existing.id },
        data: { quantity: Math.min(99, existing.quantity + line.quantity) },
      });
    } else {
      await prisma.cartLine.create({
        data: {
          cartId: userCart.id,
          productId: line.productId,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          variantKey: line.variantKey,
          variantId: line.variantId,
        },
      });
    }
  }
  await prisma.cart.delete({ where: { id: guestCart.id } });
}

export async function grantGuestOrderAccess(orderNumber: string) {
  const jar = await cookies();
  const next = appendGuestOrderNumber(jar.get(GUEST_ORDER_COOKIE)?.value, orderNumber);
  jar.set(GUEST_ORDER_COOKIE, next, guestCartCookieOptions(cookieSecure()));
}

export async function guestCanAccessOrder(orderNumber: string) {
  const jar = await cookies();
  return parseGuestOrderNumbers(jar.get(GUEST_ORDER_COOKIE)?.value).includes(orderNumber.toUpperCase());
}
