"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/domain/money";
import {
  assignCardCheckoutTab,
  closeCardCheckoutTab,
  openCardCheckoutPlaceholder,
  showCardCheckoutError,
} from "@/lib/checkout/card-checkout-tab";

type HandoffResponse = {
  ok?: boolean;
  url?: string;
  error?: string;
  alreadyPaid?: boolean;
  openInNewTab?: boolean;
};

export function PaymentHandoffClient({
  orderNumber,
  totalCents,
  methodLabel,
  openInNewTab = false,
}: {
  orderNumber: string;
  totalCents: number;
  methodLabel?: string;
  openInNewTab?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [cardTabOpened, setCardTabOpened] = useState(false);
  const started = useRef(false);
  const confirmationHref = `/order/${encodeURIComponent(orderNumber)}/confirmation`;

  const beginHandoff = useCallback(async (fromUserClick = false) => {
    const placeholder = openInNewTab && fromUserClick ? openCardCheckoutPlaceholder() : null;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/payment-handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ orderNumber }),
      });
      let data: HandoffResponse = {};
      try {
        data = (await res.json()) as HandoffResponse;
      } catch {
        data = {};
      }
      if (data.alreadyPaid) {
        closeCardCheckoutTab(placeholder);
        window.location.assign(confirmationHref);
        return;
      }
      if (!res.ok || !data.ok || !data.url) {
        const message = data.error ?? `Could not open the payment page (${res.status}). Try again or contact support.`;
        showCardCheckoutError(placeholder, message);
        setError(message);
        setBusy(false);
        return;
      }
      if (openInNewTab || data.openInNewTab) {
        const opened = assignCardCheckoutTab(placeholder, data.url);
        setCheckoutUrl(data.url);
        setCardTabOpened(opened);
        setBusy(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      const message = "Could not open the payment page. Try again.";
      showCardCheckoutError(placeholder, message);
      setError(message);
      setBusy(false);
    }
  }, [confirmationHref, openInNewTab, orderNumber]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void beginHandoff();
  }, [beginHandoff]);

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-border bg-card p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Secure payment</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {error
          ? "Payment page did not open"
          : checkoutUrl
            ? cardTabOpened
              ? "Card checkout opened in a new tab"
              : "Open card checkout in a new tab"
            : "Opening your secure payment page"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Order <strong className="font-semibold text-foreground">{orderNumber}</strong> is created. Total{" "}
        <strong className="font-semibold text-foreground">{formatUsd(totalCents)}</strong>
        {methodLabel ? (
          <>
            {" · "}
            {methodLabel}.
          </>
        ) : (
          "."
        )}
      </p>
      {error ? (
        <>
          <p className="mt-6 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button type="button" size="lg" className="h-12 gap-2" disabled={busy} onClick={() => void beginHandoff(true)}>
              <Lock className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              {busy ? "Trying again…" : "Try again"}
            </Button>
            <Button type="button" size="lg" variant="outline" className="h-12" asChild>
              <Link href={confirmationHref}>View order</Link>
            </Button>
          </div>
        </>
      ) : checkoutUrl ? (
        <>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            {cardTabOpened
              ? "Complete payment in the new tab. Keep this page open — it is your order while you pay."
              : "Your browser blocked the automatic popup. Open card checkout below, or allow popups for this site."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {!cardTabOpened ? (
              <Button type="button" size="lg" className="h-12 gap-2" asChild>
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                  <Lock className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  Open card checkout
                </a>
              </Button>
            ) : (
              <Button type="button" size="lg" variant="outline" className="h-12 gap-2" asChild>
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                  <Lock className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  Open checkout again
                </a>
              </Button>
            )}
            <Button type="button" size="lg" variant="outline" className="h-12" asChild>
              <Link href={confirmationHref}>View order</Link>
            </Button>
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Stay on this page. We will send you to the hosted checkout next.</p>
      )}
    </div>
  );
}
