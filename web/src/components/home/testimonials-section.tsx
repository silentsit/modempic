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
      "The modafinil options were clearly labeled and easy to compare. I appreciated the straightforward pricing and lack of pressure.",
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
      "I check labels and handling details carefully. The modafinil product pages made it easy to compare brands, strengths, and pack sizes.",
    name: "Mei L.",
    role: "Registered Dietitian",
  },
  {
    id: "tst_david",
    quote:
      "The modafinil pack-size options and transparent pricing made comparing products simple before I checked out.",
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
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
      </Container>
    </section>
  );
}
