"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { addToCartAction } from "@/lib/actions/cart";

/**
 * Lightweight Add-to-cart + Buy-now pair for non-PDP surfaces. Buy now is a plain navigation to
 * `/checkout?buy=<slug>`; the checkout page handles the auth gate so guests aren't blocked at the click.
 */
export function AddToCartButtons({ productId, slug }: { productId: string; slug: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    setMsg(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("productId", productId);
      fd.set("quantity", "1");
      await addToCartAction(fd);
      router.push("/cart");
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setMsg(
        m.includes("CART_REJECTED")
          ? "This product isn’t available or the request was invalid."
          : "Please sign in to add items to your cart.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        className="sm:min-w-[140px]"
        disabled={pending}
        onClick={() => {
          void add().catch(() => {
            setPending(false);
            setMsg("Something went wrong. Please try again.");
          });
        }}
      >
        {pending ? "Adding…" : "Add to cart"}
      </Button>
      <Button variant="secondary" className="sm:min-w-[140px]" asChild>
        <Link href={`/checkout?buy=${encodeURIComponent(slug)}`}>Buy now</Link>
      </Button>
      {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
    </div>
  );
}
