"use client";

import { useEffect, useState } from "react";
import { PaymentStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

type StatusPayload = {
  ok?: boolean;
  orderStatus?: string;
  paymentStatus?: PaymentStatus | null;
  provider?: string | null;
  payAddress?: string | null;
  paid?: boolean;
};

const POLL_MS = 4000;
const MAX_POLLS = 15;

function formatOrderStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function ConfirmationStatus({
  orderNumber,
  initialOrderStatus,
  initialPaymentStatus,
  initialProvider,
  initialPayAddress,
}: {
  orderNumber: string;
  initialOrderStatus: string;
  initialPaymentStatus: PaymentStatus | null;
  initialProvider: string | null;
  initialPayAddress: string | null;
}) {
  const [orderStatus, setOrderStatus] = useState(initialOrderStatus);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [provider, setProvider] = useState(initialProvider);
  const [payAddress, setPayAddress] = useState(initialPayAddress);
  const [paid, setPaid] = useState(initialPaymentStatus === PaymentStatus.SUCCEEDED);

  const shouldPoll =
    !paid &&
    paymentStatus === PaymentStatus.PENDING &&
    (provider === "peptidepay" || provider === "paymento");

  useEffect(() => {
    if (!shouldPoll) return;
    let polls = 0;
    let timer: number | undefined;
    let cancelled = false;

    const tick = async () => {
      polls += 1;
      try {
        const res = await fetch(`/api/checkout/payment-status?order=${encodeURIComponent(orderNumber)}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await res.json()) as StatusPayload;
        if (cancelled) return;
        if (data.ok) {
          if (data.orderStatus) setOrderStatus(data.orderStatus);
          if (data.paymentStatus) setPaymentStatus(data.paymentStatus);
          if (data.provider) setProvider(data.provider);
          if (data.payAddress) setPayAddress(data.payAddress);
          if (data.paid) {
            setPaid(true);
            return;
          }
        }
      } catch {
        // Keep the last known pending state; the next tick retries.
      }
      if (!cancelled && polls < MAX_POLLS) {
        timer = window.setTimeout(() => void tick(), POLL_MS);
      }
    };

    timer = window.setTimeout(() => void tick(), POLL_MS);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [orderNumber, shouldPoll]);

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {paid ? "Payment received" : "Thanks for Your Order"}
      </h1>
      <p className="mt-2 text-[var(--muted-foreground)]">
        Order <strong className="text-[var(--foreground)]">{orderNumber}</strong> — status:{" "}
        <strong>{formatOrderStatus(orderStatus)}</strong>
        {paid ? <span className="ml-1 text-[var(--foreground)]">· Paid</span> : null}
      </p>
      {!paid && paymentStatus === PaymentStatus.PENDING && provider === "peptidepay" ? (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">Complete Card Payment</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Finish Apple Pay, Google Pay, or card on the hosted checkout page. This page updates when the payment
            webhook confirms settlement.
          </p>
          <Button className="mt-4" asChild>
            <a
              href={payAddress ?? `/checkout/payment?order=${encodeURIComponent(orderNumber)}`}
              rel="noopener noreferrer"
            >
              Continue to card checkout
            </a>
          </Button>
        </div>
      ) : null}
      {!paid && paymentStatus === PaymentStatus.PENDING && provider === "paymento" ? (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="font-semibold">Complete Crypto Payment (Paymento)</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Complete payment on Paymento&apos;s page. This page updates when Paymento confirms the transfer.
          </p>
          <Button className="mt-4" asChild>
            <a
              href={payAddress ?? `/checkout/payment?order=${encodeURIComponent(orderNumber)}`}
              rel="noopener noreferrer"
              target={payAddress ? "_blank" : undefined}
            >
              Open Paymento checkout
            </a>
          </Button>
        </div>
      ) : null}
    </>
  );
}
