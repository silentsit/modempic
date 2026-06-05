import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { getProductReviewEligibility } from "@/lib/data/reviews";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  const eligibility = await getProductReviewEligibility(
    session?.user?.id,
    id,
    session?.user?.role as Role | undefined,
  );

  return NextResponse.json(eligibility);
}
