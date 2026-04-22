"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { simulatePaymentCompleteAction } from "@/lib/actions/payment-simulate";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
      {pending ? "Marking…" : "Dev: mark crypto payment as received"}
    </Button>
  );
}

export function SimulatePayButton({ orderNumber, canSimulate }: { orderNumber: string; canSimulate: boolean }) {
  if (!canSimulate) {
    return (
      <p className="mt-4 text-xs text-[var(--muted-foreground)]">
        Set DEV_PAYMENT_SIMULATE=1 in development to mark simulated crypto payments as received.
      </p>
    );
  }
  return (
    <form action={simulatePaymentCompleteAction} className="mt-4">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <Submit />
    </form>
  );
}
