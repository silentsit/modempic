"use client";

import { useActionState } from "react";
import { submitCheckoutAction, type CheckoutState } from "@/lib/actions/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CryptoAsset } from "@prisma/client";

export function CheckoutForm({ assets }: { assets: CryptoAsset[] }) {
  const [state, action, pending] = useActionState(submitCheckoutAction, null as CheckoutState);

  return (
    <form action={action} className="space-y-10">
      {state?.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40">
          {state.error}
        </p>
      ) : null}

      <fieldset className="space-y-4 rounded-2xl border border-[var(--border)] p-6">
        <legend className="text-lg font-semibold">Shipping</legend>
        <div>
          <Label htmlFor="shipFullName">Full name</Label>
          <Input id="shipFullName" name="shipFullName" required className="mt-1.5" autoComplete="shipping name" />
        </div>
        <div>
          <Label htmlFor="shipLine1">Address line 1</Label>
          <Input id="shipLine1" name="shipLine1" required className="mt-1.5" autoComplete="shipping address-line1" />
        </div>
        <div>
          <Label htmlFor="shipLine2">Address line 2 (optional)</Label>
          <Input id="shipLine2" name="shipLine2" className="mt-1.5" autoComplete="shipping address-line2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="shipCity">City</Label>
            <Input id="shipCity" name="shipCity" required className="mt-1.5" autoComplete="shipping address-level2" />
          </div>
          <div>
            <Label htmlFor="shipState">State</Label>
            <Input id="shipState" name="shipState" required maxLength={2} className="mt-1.5" autoComplete="shipping address-level1" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="shipPostal">ZIP</Label>
            <Input id="shipPostal" name="shipPostal" required className="mt-1.5" autoComplete="shipping postal-code" />
          </div>
          <div>
            <Label htmlFor="shipPhone">Phone (optional)</Label>
            <Input id="shipPhone" name="shipPhone" type="tel" className="mt-1.5" autoComplete="shipping tel" />
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <input type="checkbox" name="billSame" id="billSame" defaultChecked className="h-4 w-4 rounded border-[var(--border)]" />
        <Label htmlFor="billSame" className="font-normal">
          Billing address same as shipping
        </Label>
      </div>

      <fieldset className="space-y-4 rounded-2xl border border-[var(--border)] p-6">
        <legend className="text-lg font-semibold">Billing (if different)</legend>
        <p className="text-sm text-[var(--muted-foreground)]">Uncheck the box above to require these fields at submit.</p>
        <div>
          <Label htmlFor="billFullName">Full name</Label>
          <Input id="billFullName" name="billFullName" className="mt-1.5" autoComplete="billing name" />
        </div>
        <div>
          <Label htmlFor="billLine1">Address line 1</Label>
          <Input id="billLine1" name="billLine1" className="mt-1.5" autoComplete="billing address-line1" />
        </div>
        <div>
          <Label htmlFor="billLine2">Address line 2 (optional)</Label>
          <Input id="billLine2" name="billLine2" className="mt-1.5" autoComplete="billing address-line2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="billCity">City</Label>
            <Input id="billCity" name="billCity" className="mt-1.5" autoComplete="billing address-level2" />
          </div>
          <div>
            <Label htmlFor="billState">State</Label>
            <Input id="billState" name="billState" maxLength={2} className="mt-1.5" autoComplete="billing address-level1" />
          </div>
        </div>
        <div>
          <Label htmlFor="billPostal">ZIP</Label>
          <Input id="billPostal" name="billPostal" className="mt-1.5" autoComplete="billing postal-code" />
        </div>
        <div>
          <Label htmlFor="billPhone">Phone (optional)</Label>
          <Input id="billPhone" name="billPhone" type="tel" className="mt-1.5" autoComplete="billing tel" />
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-[var(--border)] p-6">
        <legend className="text-lg font-semibold">Payment</legend>
        <p className="text-sm text-[var(--muted-foreground)]">
          Crypto is selected by default. For cards, you may be sent to a partner on-ramp; KYC/verification depends on the
          partner and your transaction.
        </p>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" name="paymentMethod" value="CRYPTO" defaultChecked className="h-4 w-4" />
            <span>Cryptocurrency (default)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" name="paymentMethod" value="CARD_ONRAMP" className="h-4 w-4" />
            <span>Card via on-ramp partner</span>
          </label>
        </div>
        <div>
          <Label htmlFor="asset">Asset (for crypto)</Label>
          <select
            id="asset"
            name="asset"
            className="mt-1.5 flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
            defaultValue="USDT"
          >
            {assets.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="couponCode">Coupon (optional)</Label>
          <Input id="couponCode" name="couponCode" className="mt-1.5" placeholder="WELCOME10" autoComplete="off" />
        </div>
      </fieldset>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Placing order…" : "Place order"}
      </Button>
    </form>
  );
}
