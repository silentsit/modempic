"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/admin";
import { sendPasswordResetForEmail } from "@/lib/auth/password-reset";

export type AdminUserFormState = { error?: string; success?: string } | null;

const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(120).optional(),
  email: z.string().email().max(255).optional(),
  role: z.nativeEnum(Role),
  banned: z.enum(["0", "1"]),
});

async function assertCanManageUser(
  actorId: string,
  actorRole: Role,
  targetId: string,
): Promise<{ target: { id: string; role: Role; email: string | null } } | { error: string }> {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, email: true },
  });
  if (!target) return { error: "User not found." };
  if (target.role !== Role.CUSTOMER && actorRole !== Role.ADMIN) {
    return { error: "Only administrators can manage staff and admin accounts." };
  }
  return { target };
}

export async function updateUserAction(
  _prev: AdminUserFormState,
  formData: FormData,
): Promise<AdminUserFormState> {
  const session = await requireStaff();
  const raw = {
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim() || undefined,
    role: String(formData.get("role") ?? "") as Role,
    banned: (formData.get("banned") === "1" ? "1" : "0") as "0" | "1",
  };
  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) return { error: "Please check the form fields." };

  const { id, name, role, banned } = parsed.data;
  const email = parsed.data.email?.toLowerCase();

  const allowed = await assertCanManageUser(session.user.id, session.user.role as Role, id);
  if ("error" in allowed) return { error: allowed.error };

  if (id === session.user.id) {
    if (role !== (session.user.role as Role)) {
      return { error: "You cannot change your own role." };
    }
    if (banned === "1") {
      return { error: "You cannot ban your own account." };
    }
  }

  if ((role === Role.ADMIN || role === Role.STAFF) && session.user.role !== Role.ADMIN) {
    return { error: "Only administrators can assign staff or admin roles." };
  }

  if (email) {
    const conflict = await prisma.user.findFirst({
      where: { email, NOT: { id } },
      select: { id: true },
    });
    if (conflict) return { error: "Another account already uses that email." };
  }

  await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name || null } : {}),
      ...(email ? { email } : {}),
      role,
      bannedAt: banned === "1" ? new Date() : null,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return { success: "User updated." };
}

export async function deleteUserAction(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/users?notice=error");

  if (id === session.user.id) {
    redirect("/admin/users?notice=cannot_delete_self");
  }

  const allowed = await assertCanManageUser(session.user.id, session.user.role as Role, id);
  if ("error" in allowed) redirect(`/admin/users/${id}?notice=error`);

  const orderCount = await prisma.order.count({ where: { userId: id } });
  if (orderCount > 0) {
    redirect(`/admin/users/${id}?notice=has_orders`);
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  redirect("/admin/users?notice=deleted");
}

export async function sendUserPasswordResetAction(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/users?notice=error");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, passwordHash: true, role: true },
  });
  if (!user?.email) redirect(`/admin/users/${id}?notice=no_email`);

  if (user.role !== Role.CUSTOMER && session.user.role !== Role.ADMIN) {
    redirect(`/admin/users/${id}?notice=forbidden`);
  }

  const { sent, isSetPassword } = await sendPasswordResetForEmail(user.email);
  const notice = sent ? (isSetPassword ? "set_password_sent" : "reset_sent") : "reset_failed";
  redirect(`/admin/users/${id}?notice=${notice}`);
}
