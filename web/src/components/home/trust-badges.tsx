import { Container } from "@/components/site/container";
import { Reveal } from "@/components/home/reveal";
import { Lock, Package, Shield, FileText } from "lucide-react";

/**
 * Icon accent follows token semantics: Forest Green (`primary`) marks
 * trust/security guarantees, Slate Blue (`accent`) marks informational
 * / logistics details. Keeps the grid legible at a glance instead of a
 * single flat accent color across all four cards.
 */
const badges = [
  { icon: Lock, label: "Secure Checkout", sub: "Card, Apple Pay, Google Pay, or crypto", tone: "primary" },
  { icon: Package, label: "Tracked Delivery", sub: "Tracking details after shipment", tone: "accent" },
  { icon: FileText, label: "Clear Labels", sub: "Product name, strength, and pack size shown", tone: "accent" },
  { icon: Shield, label: "Discreet Packaging", sub: "Plain outer packaging on every order", tone: "primary" },
] as const;

export function TrustBadgesSection() {
  return (
    <section
      className="border-b border-border bg-background py-16"
      aria-label="Trust and policies"
    >
      <Container>
        <Reveal>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {badges.map(({ icon: Icon, label, sub, tone }) => (
              <li
                key={label}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <span
                  className={
                    tone === "primary"
                      ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle"
                      : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle"
                  }
                >
                  <Icon
                    className={tone === "primary" ? "h-5 w-5 text-primary" : "h-5 w-5 text-accent"}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
                <div>
                  <p className="font-medium leading-tight text-foreground">{label}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
