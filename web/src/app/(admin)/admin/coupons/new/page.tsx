import { prisma } from "@/lib/db";
import { CouponForm } from "../coupon-form";

export default async function NewCouponPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-[#1d2327]">Add new coupon</h1>
      <CouponForm coupon={null} categories={categories} />
    </div>
  );
}
