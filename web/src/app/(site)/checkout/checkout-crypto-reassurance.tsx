import { CircleCheck, Mail, Shield, Wallet } from "lucide-react";

export const INSTANT_CARD_CHECKOUT_TITLE = "Credit/debit cards (Visa, Mastercard)";
export const MANUAL_CARD_CHECKOUT_TITLE = "Credit/Debit Cards (Visa/MasterCard)";
export const INSTANT_CARD_CHECKOUT_BADGE = "⚡ Instant checkout";
export const MANUAL_CARD_CHECKOUT_BADGE = "📩 Payment link by email";

export const INSTANT_CARD_CHECKOUT_DESCRIPTION_LINES = [
  '1. Click "Place Order" to open secure checkout.',
  "2. Choose a payment provider from the options available in your country.",
  "3. Do a one-time signup (may require basic identity verification ~ 2min).",
  "4. Fill in credit/debit card details & Submit",
  "",
  "Payment complete.",
  "You will receive an email of your order confirmation. We will provide you with your tracking number within 1 - 2 business days.",
] as const;

export const MANUAL_CARD_CHECKOUT_DESCRIPTION_LINES = [
  '1. Click "Place Order" to checkout.',
  "2. You will receive an email with a payment link within 2 hours.",
  "3. Click on the payment link and complete the payment via your credit/debit card.",
  "",
  "You will receive your tracking number within 1 - 2 business days.",
] as const;

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
    title: "Order confirmation after payment",
    body: "The order confirmation email is sent only after the cryptocurrency transaction is fully confirmed on-chain — not when you place the order.",
  },
  {
    icon: CircleCheck,
    title: "Totals shown upfront",
    body: "Shipping, tax, and any promo discount are calculated before you commit to payment.",
  },
] as const;

function CardCheckoutCopy({ lines }: { lines: readonly string[] }) {
  return (
    <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{lines.join("\n")}</p>
  );
}

function CardCheckoutReassurance() {
  return (
    <div className="rounded-2xl border border-border bg-muted p-5">
      <CardCheckoutCopy lines={INSTANT_CARD_CHECKOUT_DESCRIPTION_LINES} />
    </div>
  );
}

function ManualCardCheckoutReassurance() {
  return (
    <div className="rounded-2xl border border-border bg-muted p-5">
      <CardCheckoutCopy lines={MANUAL_CARD_CHECKOUT_DESCRIPTION_LINES} />
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
