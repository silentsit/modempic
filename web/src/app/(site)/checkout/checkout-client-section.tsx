"use client";

import { useEffect, useRef, useState } from "react";
import type { CryptoAsset } from "@prisma/client";
import type { CryptoCheckoutProvider } from "@/lib/payments/crypto-provider";
import {
  previewCheckoutCouponAction,
  type CheckoutCouponPreview,
} from "@/lib/actions/checkout";
import { checkoutTaxCents, computeShippingCents } from "@/lib/domain/checkout-pricing";
import { CheckoutForm } from "./ui";
import { FreeShippingProgressBar } from "./free-shipping-bar";
import { CheckoutOrderSummary, type CheckoutSummaryLine } from "./checkout-order-summary";

function defaultTotals(subtotalCents: number): CheckoutCouponPreview {
  const subtotalAfterDiscountCents = subtotalCents;
  const shippingCents = computeShippingCents(subtotalAfterDiscountCents);
  const taxCents = checkoutTaxCents(subtotalAfterDiscountCents);

  return {
    discountCents: 0,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
    subtotalAfterDiscountCents,
  };
}

export function CheckoutClientSection({
  assets,
  userDisplayName,
  userEmail,
  lines,
  subtotalCents,
  assetProviders,
  btcpayUrl,
}: {
  assets: CryptoAsset[];
  userDisplayName: string;
  userEmail: string;
  lines: CheckoutSummaryLine[];
  subtotalCents: number;
  assetProviders: Record<CryptoAsset, CryptoCheckoutProvider>;
  btcpayUrl: string | null;
}) {
  const [couponCode, setCouponCode] = useState("");
  const [totals, setTotals] = useState<CheckoutCouponPreview>(() => defaultTotals(subtotalCents));
  const [couponPending, setCouponPending] = useState(false);
  const previewRequest = useRef(0);

  useEffect(() => {
    const code = couponCode.trim();
    const requestId = previewRequest.current + 1;
    previewRequest.current = requestId;

    if (!code) {
      setTotals(defaultTotals(subtotalCents));
      setCouponPending(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setCouponPending(true);
      void previewCheckoutCouponAction(code)
        .then((nextTotals) => {
          if (previewRequest.current === requestId) {
            setTotals(nextTotals);
          }
        })
        .catch(() => {
          if (previewRequest.current === requestId) {
            setTotals({ ...defaultTotals(subtotalCents), message: "Could not check promo code. It will be verified when you place the order." });
          }
        })
        .finally(() => {
          if (previewRequest.current === requestId) {
            setCouponPending(false);
          }
        });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [couponCode, subtotalCents]);

  return (
    <>
      <div className="mt-6">
        <FreeShippingProgressBar subtotalAfterDiscountCents={totals.subtotalAfterDiscountCents} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_min(380px,100%)] lg:items-start">
        <CheckoutForm
          assets={assets}
          userDisplayName={userDisplayName}
          userEmail={userEmail}
          assetProviders={assetProviders}
          btcpayUrl={btcpayUrl}
        />
        <CheckoutOrderSummary
          lines={lines}
          subtotalCents={subtotalCents}
          discountCents={totals.discountCents}
          shippingCents={totals.shippingCents}
          taxCents={totals.taxCents}
          totalCents={totals.totalCents}
          couponCode={couponCode}
          couponPending={couponPending}
          couponMessage={totals.message}
          onCouponCodeChange={setCouponCode}
        />
      </div>
    </>
  );
}
