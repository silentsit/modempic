import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/home/reveal";
import { Badge } from "@/components/ui/badge";
import type { Testimonial } from "@/types";

/**
 * TODO(cursor): move to Sanity "testimonial" documents. `avatar` maps to
 * SanityImage; Unsplash URLs are placeholders for migration.
 */
const items: (Omit<Testimonial, "avatar"> & { imageSrc: string; imageAlt: string })[] = [
  {
    id: "tst_marcus",
    quote:
      "Clear labeling and no pressure. I appreciate that Modempic keeps pricing straightforward and product records easy to compare.",
    name: "Marcus T.",
    role: "Urban Planner",
    imageSrc:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces&q=80",
    imageAlt: "Portrait of Marcus T.",
  },
  {
    id: "tst_emily",
    quote:
      "Checkout was smooth, the order updates were clear, and support responded quickly when I had a question about payment timing.",
    name: "Emily R.",
    role: "Software Engineering",
    imageSrc:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces&q=80",
    imageAlt: "Portrait of Emily R.",
  },
  {
    id: "tst_mei",
    quote:
      "I compare testing notes, labels, and handling details before I order. This site's product pages made that easier than most shops I've used.",
    name: "Mei L.",
    role: "Registered dietitian",
    imageSrc:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop&crop=faces&q=80",
    imageAlt: "Portrait of Mei L.",
  },
];

/**
 * TODO(cursor): Sanity "trustSignal" documents (see TrustSignal in types.ts).
 * Local asset paths map to `logo.asset.url`.
 */
const trustBadges = [
  { src: "/trust-badges/paymento.png", alt: "Paymento crypto checkout" },
  { src: "/trust-badges/ssl-secure.png", alt: "TLS-encrypted checkout" },
  { src: "/trust-badges/discreet-shipping.png", alt: "Discreet plain packaging" },
  { src: "/trust-badges/tracked-delivery.png", alt: "Tracked delivery" },
] as const;

export function TestimonialsSection() {
  return (
    <section className="border-b border-border bg-background py-16 sm:py-20" aria-labelledby="testimonials-heading">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge className="mx-auto">Customer feedback</Badge>
          <h2 id="testimonials-heading" className="mt-3 text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What Customers Say
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
            Real feedback from people who value transparency and a smooth shopping experience.
          </p>
        </Reveal>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <li key={t.id} className="h-full list-none">
              <Card className="flex h-full flex-col shadow-[var(--shadow-card)]">
                <CardContent className="flex flex-1 flex-col pt-7">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote portrait URLs from Unsplash */}
                  <img
                    src={t.imageSrc}
                    alt={t.imageAlt}
                    width={72}
                    height={72}
                    className="h-[72px] w-[72px] shrink-0 rounded-full border border-border object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-foreground">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <footer className="mt-6 border-t border-border pt-4">
                    <p className="font-medium text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </footer>
                </CardContent>
              </Card>
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
