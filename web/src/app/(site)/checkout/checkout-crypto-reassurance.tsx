import { CircleCheck, Mail, Shield, Wallet } from "lucide-react";

const points = [
  {
    icon: Wallet,
    title: "Direct crypto routing",
    body: "Bitcoin uses BTCPay; supported stablecoins and altcoins use Paymento. We never store card numbers on this site.",
  },
  {
    icon: Shield,
    title: "Confirmed before fulfillment",
    body: "Your order advances after the payment provider webhook confirms funds — not when you click place order.",
  },
  {
    icon: Mail,
    title: "Order updates by email",
    body: "Payment status, tracking, and support replies stay tied to the account you sign in with.",
  },
  {
    icon: CircleCheck,
    title: "Totals shown upfront",
    body: "Shipping, tax, and any promo discount are calculated before you commit to payment.",
  },
] as const;

export function CheckoutCryptoReassurance() {
  return (
    <div className="rounded-2xl border border-border bg-muted p-5">
      <p className="text-sm font-semibold text-foreground">Why crypto checkout is safe here</p>
      <ul className="mt-4 space-y-3.5">
        {points.map((point) => (
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
