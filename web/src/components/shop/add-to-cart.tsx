"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { addToCartAction, buyNowAction } from "@/lib/actions/cart";

export function AddToCartButtons({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"cart" | "buy" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    setMsg(null);
    setPending("cart");
    try {
      const fd = new FormData();
      fd.set("productId", productId);
      fd.set("quantity", "1");
      await addToCartAction(fd);
      router.push("/cart");
    } catch {
      setMsg("Please sign in to add items to your cart.");
    } finally {
      setPending(null);
    }
  }

  async function buy() {
    setMsg(null);
    setPending("buy");
    try {
      const fd = new FormData();
      fd.set("productId", productId);
      await buyNowAction(fd);
      router.push("/checkout");
    } catch {
      setMsg("Please sign in to continue to checkout.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button className="sm:min-w-[140px]" disabled={!!pending} onClick={add}>
        {pending === "cart" ? "Adding…" : "Add to cart"}
      </Button>
      <Button variant="secondary" className="sm:min-w-[140px]" disabled={!!pending} onClick={buy}>
        {pending === "buy" ? "Redirecting…" : "Buy now"}
      </Button>
      {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
    </div>
  );
}
