"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteOrderAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function OrderDeleteButton({
  orderId,
  orderNumber,
  returnTo = "/admin/orders",
  variant = "icon",
}: {
  orderId: string;
  orderNumber: string;
  returnTo?: string;
  variant?: "icon" | "trash";
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete order #${orderNumber}? This cannot be undone.`)) return;
    const fd = new FormData();
    fd.set("id", orderId);
    fd.set("returnTo", returnTo);
    startTransition(() => {
      void deleteOrderAction(fd);
    });
  }

  if (variant === "trash") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="inline-flex items-center gap-1 text-xs font-medium text-[#a82220] hover:underline disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {pending ? "Deleting…" : "Move to Trash"}
      </button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-7 text-xs text-[#a82220] hover:text-[#a82220]"
      disabled={pending}
      onClick={handleDelete}
      title="Delete order"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
