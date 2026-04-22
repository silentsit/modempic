import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireStaff() {
  const s = await auth();
  if (!s?.user?.id) redirect("/login?callbackUrl=/admin");
  if (s.user.role !== "ADMIN" && s.user.role !== "STAFF") redirect("/");
  return s;
}
