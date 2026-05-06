import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/site/container";

const items = [
  {
    quote:
      "Clear labeling and no pressure. Been getting my cognitive enhancers from them and appreciate that Modempic keeps pricing straightforward.",
    name: "Marcus T.",
    role: "Urban Planner",
    imageSrc:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces&q=80",
    imageAlt: "Portrait of Marcus T.",
  },
  {
    quote:
      "Getting Ivermectin from my local vet is really expensive. Modempic's stuff is way cheaper and 100% genuine. Checkout was smooth and support was super responsive.",
    name: "Emily R.",
    role: "Software Engineering",
    imageSrc:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces&q=80",
    imageAlt: "Portrait of Emily R.",
  },
  {
    quote:
      "I compare third-party test info and ingredients before I buy. This site's product pages made that easier than most shops I've used.",
    name: "Mei L.",
    role: "Registered dietitian",
    imageSrc:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop&crop=faces&q=80",
    imageAlt: "Portrait of Mei L.",
  },
] as const;

const trustBadges = [
  { src: "/trust-badges/mcafee-secure.png", alt: "McAfee Secure" },
  { src: "/trust-badges/norton-secure.png", alt: "Norton Secured powered by VeriSign" },
  { src: "/trust-badges/google-trusted-store.png", alt: "Google Trusted Store" },
  { src: "/trust-badges/bbb-accredited-business.png", alt: "BBB Accredited Business" },
  { src: "/trust-badges/trustpilot.png", alt: "Trustpilot" },
] as const;

export function TestimonialsSection() {
  return (
    <section className="border-b border-[var(--border)] py-16 sm:py-20" aria-labelledby="testimonials-heading">
      <Container>
        <h2 id="testimonials-heading" className="text-center text-2xl font-semibold sm:text-3xl">
          What Customers Say
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-[var(--muted-foreground)]">
          Real feedback from people who value transparency and a smooth shopping experience.
        </p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <li key={t.name} className="h-full list-none">
              <Card className="flex h-full flex-col">
                <CardContent className="flex flex-1 flex-col pt-6">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote portrait URLs from Unsplash */}
                  <img
                    src={t.imageSrc}
                    alt={t.imageAlt}
                    width={72}
                    height={72}
                    className="h-[72px] w-[72px] shrink-0 rounded-full object-cover ring-2 ring-[var(--border)]"
                    loading="lazy"
                    decoding="async"
                  />
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-[var(--foreground)]">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <footer className="mt-6 border-t border-[var(--border)] pt-4">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">{t.role}</p>
                  </footer>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mx-auto mt-12 max-w-6xl text-center" aria-label="Trust and payment badges">
          <p className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
            24-hour Support. Secure Payment System. Guaranteed Delivery.
          </p>
          <ul className="mt-8 flex w-full flex-nowrap items-center justify-between gap-3 sm:gap-5">
            {trustBadges.map((badge) => (
              <li key={badge.src} className="list-none">
                <Image
                  src={badge.src}
                  alt={badge.alt}
                  width={260}
                  height={149}
                  className="h-[clamp(3rem,7vw,6.5rem)] w-auto max-w-[18vw] object-contain"
                  sizes="18vw"
                />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
