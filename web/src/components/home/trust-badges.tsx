import { Container } from "@/components/site/container";
import { Lock, Package, Shield, DollarSign } from "lucide-react";

const badges = [
  { icon: Lock, label: "Secure Checkout", sub: "Safe and seamless payments" },
  { icon: Package, label: "Global Tracking", sub: "Track parcels anywhere worldwide" },
  { icon: DollarSign, label: "No Hidden Costs", sub: "Transparent pricing, Zero surprises." },
  { icon: Shield, label: "Guaranteed Delivery", sub: "Right to your doorstep. No signature required." },
] as const;

export function TrustBadgesSection() {
  return (
    <section className="border-b border-white/35 bg-[var(--hero)] py-12 text-white" aria-label="Trust and policies">
      <Container>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map(({ icon: Icon, label, sub }) => (
            <li key={label} className="flex gap-3 rounded-xl border border-white/50 bg-[var(--hero)] p-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-white" aria-hidden />
              <div>
                <p className="font-medium leading-tight">{label}</p>
                <p className="mt-1 text-sm text-white/85">{sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
