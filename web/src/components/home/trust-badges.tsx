import { Container } from "@/components/site/container";
import { Lock, Package, Shield, FileText } from "lucide-react";

const badges = [
  { icon: Lock, label: "Secure Checkout", sub: "Crypto payment via Paymento" },
  { icon: Package, label: "Tracked Delivery", sub: "Tracking details after shipment" },
  { icon: FileText, label: "Clear Labels", sub: "Product name, strength, and pack size shown" },
  { icon: Shield, label: "Discreet Packaging", sub: "Plain outer packaging on every order" },
] as const;

export function TrustBadgesSection() {
  return (
    <section
      className="border-b border-border bg-background py-16"
      aria-label="Trust and policies"
    >
      <Container>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map(({ icon: Icon, label, sub }) => (
            <li
              key={label}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle">
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="font-medium leading-tight text-foreground">{label}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
