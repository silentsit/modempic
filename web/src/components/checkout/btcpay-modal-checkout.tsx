"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type BtcpayModalApi = {
  showInvoice: (invoiceId: string) => void;
  hideFrame?: () => void;
  onModalReceiveMessage: (cb: (event: MessageEvent) => void) => void;
};

declare global {
  interface Window {
    btcpay?: BtcpayModalApi;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

type Props = {
  invoiceId: string;
  checkoutLink: string;
  confirmationUrl: string;
  btcpayUrl: string;
  /** When true, opens the modal as soon as btcpay.js loads. */
  autoOpen?: boolean;
  buttonLabel?: string;
};

export function BtcpayModalCheckout({
  invoiceId,
  checkoutLink,
  confirmationUrl,
  btcpayUrl,
  autoOpen = false,
  buttonLabel = "Open Bitcoin checkout",
}: Props) {
  const [scriptReady, setScriptReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const openedRef = useRef(false);

  const openModal = useCallback(() => {
    if (!window.btcpay) {
      setStatusMessage("Payment window is still loading. Try again in a moment.");
      return;
    }
    setStatusMessage(null);
    window.btcpay.showInvoice(invoiceId);
  }, [invoiceId]);

  useEffect(() => {
    if (!scriptReady || !window.btcpay) return;

    window.btcpay.onModalReceiveMessage((event) => {
      const data = event.data;
      if (isRecord(data) && typeof data.status === "string") {
        switch (data.status) {
          case "complete":
          case "paid":
            window.location.assign(confirmationUrl);
            return;
          case "expired":
            window.btcpay?.hideFrame?.();
            setStatusMessage("This invoice expired. Use the link below or contact support to get a new payment link.");
            return;
          default:
            break;
        }
      } else if (data === "close") {
        setStatusMessage("Payment window closed. You can reopen it below when ready.");
      }
    });

    if (autoOpen && !openedRef.current) {
      openedRef.current = true;
      openModal();
    }
  }, [scriptReady, autoOpen, confirmationUrl, openModal]);

  const scriptSrc = `${btcpayUrl.replace(/\/$/, "")}/modal/btcpay.js`;

  return (
    <div className="space-y-3">
      <Script
        src={scriptSrc}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setStatusMessage("Could not load the payment window. Use the backup link below.")}
      />
      <Button type="button" className="w-full sm:w-auto" onClick={openModal} disabled={!scriptReady}>
        {scriptReady ? buttonLabel : "Loading payment…"}
      </Button>
      <p className="text-sm text-[var(--muted-foreground)]">
        Pay with Bitcoin on-chain or Lightning. Funds go directly to our wallet — no middleman.
      </p>
      {statusMessage ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          {statusMessage}
        </p>
      ) : null}
      <a
        href={checkoutLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm font-medium text-[var(--primary)] underline-offset-2 hover:underline"
      >
        Open payment page in a new tab
      </a>
    </div>
  );
}
