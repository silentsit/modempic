import type { Metadata } from "next";
import { auth } from "@/auth";
import { ProfileForm } from "./form";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });

  return (
    <div>
      <h2 className="text-xl font-semibold">Profile</h2>
      <div className="mt-4 max-w-md">
        <ProfileForm defaultName={user?.name ?? ""} email={user?.email ?? ""} />
      </div>
    </div>
  );
}
