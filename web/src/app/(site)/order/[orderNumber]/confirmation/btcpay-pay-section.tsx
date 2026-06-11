"use client";

import { BtcpayModalCheckout } from "@/components/checkout/btcpay-modal-checkout";

export function BtcpayOrderPaySection({
  invoiceId,
  checkoutLink,
  confirmationUrl,
  btcpayUrl,
  autoOpen = false,
}: {
  invoiceId: string;
  checkoutLink: string;
  confirmationUrl: string;
  btcpayUrl: string;
  autoOpen?: boolean;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="font-semibold">Complete Bitcoin payment</h2>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Your order is waiting for payment. Open the checkout window to pay with Bitcoin on-chain or Lightning.
      </p>
      <div className="mt-4">
        <BtcpayModalCheckout
          invoiceId={invoiceId}
          checkoutLink={checkoutLink}
          confirmationUrl={confirmationUrl}
          btcpayUrl={btcpayUrl}
          autoOpen={autoOpen}
          buttonLabel="Pay now"
        />
      </div>
    </div>
  );
}
