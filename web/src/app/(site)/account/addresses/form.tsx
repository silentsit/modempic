"use client";

import { useActionState } from "react";
import { createAddressAction, type AddressState } from "@/lib/actions/address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddressForm() {
  const [state, action, pending] = useActionState(createAddressAction, null as AddressState);
  return (
    <form action={action} className="space-y-3">
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      <div>
        <Label htmlFor="label">Label (optional)</Label>
        <Input id="label" name="label" className="mt-1" placeholder="Home" />
      </div>
      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="line1">Line 1</Label>
        <Input id="line1" name="line1" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="line2">Line 2</Label>
        <Input id="line2" name="line2" className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" required maxLength={2} className="mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="postal">ZIP</Label>
        <Input id="postal" name="postal" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" className="mt-1" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefaultShipping" className="h-4 w-4" />
        Default shipping
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefaultBilling" className="h-4 w-4" />
        Default billing
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save address"}
      </Button>
    </form>
  );
}
