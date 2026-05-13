import { prisma } from "@/lib/db";
import { ProductForm } from "../product-form";
import { upsertProductAction } from "@/lib/actions/admin";

export default async function NewProductPage() {
  const allCategories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">New product</h1>
      <ProductForm action={upsertProductAction} allCategories={allCategories} />
    </div>
  );
}
