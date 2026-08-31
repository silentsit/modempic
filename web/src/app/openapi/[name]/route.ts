import { NextResponse } from "next/server";
import { authOpenApi, cartOpenApi, healthOpenApi } from "@/lib/api-catalog/catalog";

export const revalidate = 3600;

const specs = {
  "health.json": healthOpenApi,
  "auth.json": authOpenApi,
  "cart.json": cartOpenApi,
} as const;

type SpecName = keyof typeof specs;

export function generateStaticParams() {
  return Object.keys(specs).map((name) => ({ name }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const build = specs[name as SpecName];
  if (!build) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.json(build(), {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
      "X-Robots-Tag": "noindex, follow",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
