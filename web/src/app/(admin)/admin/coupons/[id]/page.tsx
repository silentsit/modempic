import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CouponForm } from "../coupon-form";
import { serializeCouponForForm } from "../serialize-coupon";

type Props = { params: Promise<{ id: string }> };

export default async function EditCouponPage({ params }: Props) {
  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      productIncludes: { include: { product: { select: { id: true, name: true, slug: true } } } },
      productExcludes: { include: { product: { select: { id: true, name: true, slug: true } } } },
      categoryIncludes: true,
      categoryExcludes: true,
    },
  });
  if (!coupon) notFound();

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-[#1d2327]">Edit coupon: {coupon.code}</h1>
      <CouponForm coupon={serializeCouponForForm(coupon)} categories={categories} />
    </div>
  );
}
