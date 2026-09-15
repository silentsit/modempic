const POINTS = [
  "FREE shipping on all orders",
  "Guaranteed delivery to your doorstep",
  "Secure payment with card or crypto",
  "Enjoy discounts with every purchase",
] as const;

export function ProductTrustBullets() {
  return (
    <div className="mt-6">
      <ul className="space-y-2 text-sm leading-snug text-foreground">
        {POINTS.map((point) => (
          <li key={point} className="flex gap-2.5">
            <span className="shrink-0 text-primary" aria-hidden>
              —
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm leading-snug text-foreground">24/7 support — Email or WhatsApp</p>
    </div>
  );
}
