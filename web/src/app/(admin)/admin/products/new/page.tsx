import { ProductForm } from "../product-form";
import { upsertProductAction } from "@/lib/actions/admin";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">New product</h1>
      <ProductForm action={upsertProductAction} />
    </div>
  );
}
