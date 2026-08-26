"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseCheckoutRegion } from "@/lib/checkout/checkout-geo";

const addr = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(80),
  postal: z.string().min(2).max(20),
  country: z.string().length(2),
  phone: z.string().max(30).optional(),
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
});

export type AddressState = { error?: string; success?: string } | null;

function parseForm(fd: FormData) {
  const region = parseCheckoutRegion(String(fd.get("country") ?? ""), String(fd.get("state") ?? ""));
  if (!region) return { success: false as const };

  return addr.safeParse({
    label: String(fd.get("label") ?? "") || undefined,
    fullName: String(fd.get("fullName") ?? ""),
    line1: String(fd.get("line1") ?? ""),
    line2: String(fd.get("line2") ?? "") || undefined,
    city: String(fd.get("city") ?? ""),
    state: region.state,
    postal: String(fd.get("postal") ?? ""),
    country: region.country,
    phone: String(fd.get("phone") ?? "") || undefined,
    isDefaultShipping: fd.get("isDefaultShipping") === "on",
    isDefaultBilling: fd.get("isDefaultBilling") === "on",
  });
}

export async function createAddressAction(_p: AddressState, formData: FormData): Promise<AddressState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in required." };
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Check all fields." };
  const d = parsed.data;
  if (d.isDefaultShipping) {
    await prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefaultShipping: false } });
  }
  if (d.isDefaultBilling) {
    await prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefaultBilling: false } });
  }
  await prisma.address.create({ data: { userId: session.user.id, ...d } });
  revalidatePath("/account/addresses");
  return { success: "Address saved." };
}

export async function deleteAddressAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.address.deleteMany({ where: { id, userId: session.user.id } });
  revalidatePath("/account/addresses");
}
