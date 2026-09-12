import { CircleCheck, Mail, Shield, Wallet } from "lucide-react";

const cryptoPoints = [
  {
    icon: Wallet,
    title: "Paymento checkout",
    body: "You complete payment on Paymento's secure page. We never store wallet keys or payment credentials on this site.",
  },
  {
    icon: Shield,
    title: "Confirmed before fulfillment",
    body: "Your order advances after Paymento confirms funds — not when you click place order.",
  },
  {
    icon: Mail,
    title: "Order updates by email",
    body: "Payment status, tracking, and support replies go to the email on the order.",
  },
  {
    icon: CircleCheck,
    title: "Totals shown upfront",
    body: "Shipping, tax, and any promo discount are calculated before you commit to payment.",
  },
] as const;

const cardCheckoutSteps = [
  'Click "Pay now with card" to open secure checkout.',
  "Choose a payment provider from the options available in your country.",
  "Do a one-time signup (may require basic identity verification ~ 2min).",
  "Fill in credit/debit card details & Submit.",
] as const;

const manualCardCheckoutSteps = [
  'Click on "Pay with card" to checkout.',
  "You will receive an email with a payment link within 2 hours.",
  "Click on the payment link and complete the payment via your credit/debit card.",
] as const;

function CardCheckoutReassurance() {
  return (
    <div className="rounded-2xl border border-border bg-muted p-5">
      <p className="text-sm font-semibold text-foreground">About card checkout</p>
      <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm text-muted-foreground">
        {cardCheckoutSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="mt-4 space-y-1.5 text-sm">
        <p className="font-semibold text-foreground">Payment complete.</p>
        <p className="leading-relaxed text-muted-foreground">
          You will receive an email of your order confirmation. We will provide you with your tracking number within 1 - 2
          business days.
        </p>
      </div>
    </div>
  );
}

function ManualCardCheckoutReassurance() {
  return (
    <div className="rounded-2xl border border-border bg-muted p-5">
      <ol className="list-decimal space-y-2.5 pl-5 text-sm text-muted-foreground">
        {manualCardCheckoutSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        You will receive your tracking number within 1 - 2 business days.
      </p>
    </div>
  );
}

export function CheckoutPaymentReassurance({
  method,
}: {
  method: "CRYPTO" | "CARD_ONRAMP" | "MANUAL_INVOICE";
}) {
  if (method === "CARD_ONRAMP") {
    return <CardCheckoutReassurance />;
  }
  if (method === "MANUAL_INVOICE") {
    return <ManualCardCheckoutReassurance />;
  }

  return (
    <div className="rounded-2xl border border-border bg-muted p-5">
      <p className="text-sm font-semibold text-foreground">About crypto checkout</p>
      <ul className="mt-4 space-y-3.5">
        {cryptoPoints.map((point) => (
          <li key={point.title} className="flex gap-3 text-sm">
            <point.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
            <span>
              <span className="font-medium text-foreground">{point.title}. </span>
              <span className="text-muted-foreground">{point.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CheckoutCryptoReassurance() {
  return <CheckoutPaymentReassurance method="CRYPTO" />;
}
