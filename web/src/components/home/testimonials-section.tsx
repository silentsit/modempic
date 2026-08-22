import Image from "next/image";
import { Star } from "lucide-react";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/home/reveal";
import { Badge } from "@/components/ui/badge";
import type { Testimonial } from "@/types";

/**
 * TODO(cursor): move to Sanity "testimonial" documents.
 */
const items: Omit<Testimonial, "avatar">[] = [
  {
    id: "tst_marcus",
    quote:
      "Clear labeling and no pressure. I appreciate that Modempic keeps pricing straightforward and product records easy to compare.",
    name: "Marcus T.",
    role: "Urban Planner",
  },
  {
    id: "tst_emily",
    quote:
      "Checkout was smooth, the order updates were clear, and support responded quickly when I had a question about payment timing.",
    name: "Emily R.",
    role: "Software Engineer",
  },
  {
    id: "tst_mei",
    quote:
      "I compare labels and handling details before I order. This site's product pages made that easier than most shops I've used.",
    name: "Mei L.",
    role: "Registered Dietitian",
  },
  {
    id: "tst_david",
    quote:
      "Straightforward pack-size options and transparent pricing made comparing strengths simple before I checked out.",
    name: "David K.",
    role: "Operations Manager",
  },
  {
    id: "tst_priya",
    quote:
      "Discreet packaging and tracked delivery gave me confidence ordering online for the first time.",
    name: "Priya S.",
    role: "Graphic Designer",
  },
];

/**
 * TODO(cursor): Sanity "trustSignal" documents (see TrustSignal in types.ts).
 * Local asset paths map to `logo.asset.url`.
 */
const trustBadges = [
  { src: "/trust-badges/paymento.svg", alt: "Paymento crypto checkout" },
  { src: "/trust-badges/ssl-secure.svg", alt: "TLS-encrypted checkout" },
  { src: "/trust-badges/discreet-shipping.svg", alt: "Discreet plain packaging" },
  { src: "/trust-badges/tracked-delivery.svg", alt: "Tracked delivery" },
] as const;

export function TestimonialsSection() {
  return (
    <section className="border-b border-border bg-background py-16 sm:py-20" aria-labelledby="testimonials-heading">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge className="mx-auto">Testimonials</Badge>
          <h2 id="testimonials-heading" className="mt-3 text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Trusted by Customers Everywhere
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
            Real feedback from people who value transparency and a smooth shopping experience.
          </p>
        </Reveal>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((t) => (
            <li key={t.id} className="list-none">
              <blockquote className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="mb-3 flex gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                  ))}
                </div>
                <p className="flex-1 text-sm italic leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
        <div className="mx-auto mt-14 max-w-6xl text-center" aria-label="Trust and payment badges">
          <p className="text-base font-semibold text-foreground sm:text-lg">
            Responsive support. Secure payment routing. Clear order tracking.
          </p>
          <ul className="mt-10 flex w-full flex-wrap items-center justify-center gap-4 sm:gap-5">
            {trustBadges.map((badge) => (
              <li key={badge.src} className="list-none">
                <Image
                  src={badge.src}
                  alt={badge.alt}
                  width={260}
                  height={149}
                  className="h-10 w-auto max-w-[7.5rem] object-contain opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 sm:h-12 sm:max-w-[9rem]"
                  sizes="(max-width: 640px) 30vw, 9rem"
                />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
