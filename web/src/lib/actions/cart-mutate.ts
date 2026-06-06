"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

async function getLineForUser(lineId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.cartLine.findFirst({
    where: { id: lineId, cart: { userId: session.user.id } },
  });
}

export async function updateCartLine(lineId: string, quantity: number) {
  const line = await getLineForUser(lineId);
  if (!line) return { error: "Not found" as const };
  if (quantity < 1) return removeCartLine(lineId);
  await prisma.cartLine.update({ where: { id: lineId }, data: { quantity } });
  revalidatePath("/cart");
  const session = await auth();
  if (session?.user?.id) {
    const { touchAbandonedCartFunnel } = await import("@/lib/email/funnels/enroll");
    void touchAbandonedCartFunnel(session.user.id).catch((err) =>
      console.error("[funnel] abandoned cart touch failed", err),
    );
  }
  return { ok: true as const };
}

export async function removeCartLine(lineId: string) {
  const line = await getLineForUser(lineId);
  if (!line) return { error: "Not found" as const };
  await prisma.cartLine.delete({ where: { id: lineId } });
  revalidatePath("/cart");
  const session = await auth();
  if (session?.user?.id) {
    const { touchAbandonedCartFunnel } = await import("@/lib/email/funnels/enroll");
    void touchAbandonedCartFunnel(session.user.id).catch((err) =>
      console.error("[funnel] abandoned cart touch failed", err),
    );
  }
  return { ok: true as const };
}

export async function updateLineFromForm(formData: FormData) {
  const lineId = String(formData.get("lineId") ?? "");
  const q = Number.parseInt(String(formData.get("quantity") ?? "1"), 10);
  if (!lineId) return;
  if (!Number.isFinite(q) || q < 1) return;
  return updateCartLine(lineId, q);
}
