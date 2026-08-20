"use client";

import { updateCartLineAction, removeCartLineAction } from "@/lib/actions/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CartLineForm({ lineId, quantity }: { lineId: string; quantity: number }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <form action={updateCartLineAction} className="flex items-center gap-2">
        <input type="hidden" name="lineId" value={lineId} />
        <label htmlFor={`q-${lineId}`} className="sr-only">
          Quantity
        </label>
        <Input
          id={`q-${lineId}`}
          name="quantity"
          type="number"
          min={1}
          max={99}
          defaultValue={quantity}
          className="h-9 w-16 rounded-xl border-input text-center tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
        <Button type="submit" size="sm" variant="secondary">
          Update
        </Button>
      </form>
      <form action={removeCartLineAction}>
        <input type="hidden" name="lineId" value={lineId} />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive hover:bg-transparent"
        >
          Remove
        </Button>
      </form>
    </div>
  );
}
