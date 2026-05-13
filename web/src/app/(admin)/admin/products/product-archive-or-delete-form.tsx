"use client";

import { useFormStatus } from "react-dom";
import { deleteProductAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

function SubmitLabel({ hasReferences }: { hasReferences: boolean }) {
  const { pending } = useFormStatus();
  if (pending) return hasReferences ? "Archiving…" : "Deleting…";
  return hasReferences ? "Archive" : "Delete";
}

export function ProductArchiveOrDeleteForm({ id, hasReferences }: { id: string; hasReferences: boolean }) {
  return (
    <form action={deleteProductAction} className="mt-8 max-w-xl rounded-lg border border-red-200 p-4">
      <input type="hidden" name="id" value={id} />
      <h2 className="font-medium text-red-700">{hasReferences ? "Archive product" : "Delete product"}</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {hasReferences
          ? "This product is referenced by carts, orders, or reviews, so it will be moved to Draft instead of being removed."
          : "This removes the product and related images/categories."}
      </p>
      <Button type="submit" size="sm" variant="destructive" className="mt-3">
        <SubmitLabel hasReferences={hasReferences} />
      </Button>
    </form>
  );
}
