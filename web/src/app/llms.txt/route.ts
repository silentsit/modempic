import { authMarkdownResponse } from "@/lib/auth/auth-md";
import { renderLlmsTxt } from "@/lib/api-catalog/llms-txt";
import { getPublishedProducts } from "@/lib/data/products";

export const revalidate = 3600;

export async function GET() {
  const featuredProducts = await getPublishedProducts({ bestSellersOnly: true, take: 8 });
  const body = renderLlmsTxt(undefined, {
    featuredProducts: featuredProducts.map((product) => ({
      slug: product.slug,
      name: product.name,
    })),
  });
  return authMarkdownResponse(body);
}
