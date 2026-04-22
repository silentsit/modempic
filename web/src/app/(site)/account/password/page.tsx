import type { Metadata } from "next";
import { auth } from "@/auth";
import { PasswordForm } from "./form";
import { prisma } from "@/lib/db";
export const metadata: Metadata = { title: "Password" };

export default async function PasswordPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
  if (!user?.passwordHash) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">You sign in with a social provider. Password change does not apply.</p>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Change password</h2>
      <div className="mt-4 max-w-md">
        <PasswordForm />
      </div>
    </div>
  );
}
