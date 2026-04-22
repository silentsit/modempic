import { Container } from "@/components/site/container";
import { Lock, Package, Shield, DollarSign } from "lucide-react";

const badges = [
  { icon: Lock, label: "Secure checkout", sub: "Encrypted payments & session protection" },
  { icon: Package, label: "Tracked fulfillment", sub: "Standard shipping updates" },
  { icon: DollarSign, label: "Priced in USD", sub: "Simple pricing, no hidden FX" },
  { icon: Shield, label: "Label-first shopping", sub: "Supplement facts you can read up front" },
] as const;

export function TrustBadgesSection() {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--muted)]/30 py-12" aria-label="Trust and policies">
      <Container>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map(({ icon: Icon, label, sub }) => (
            <li key={label} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" aria-hidden />
              <div>
                <p className="font-medium leading-tight">{label}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
