import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/site/container";

const items = [
  {
    quote:
      "Clear labeling and no pressure. I use the multivitamin and appreciate that Modempic keeps pricing straightforward.",
    initial: "M",
    name: "Marcus T.",
    role: "Urban planner",
  },
  {
    quote: "I wanted something simple to add to my morning routine. Checkout was quick and support answered a label question the same day.",
    initial: "E",
    name: "Emily R.",
    role: "Software engineer",
  },
  {
    quote:
      "I compare third-party test info and ingredients before I buy. This site’s product pages made that easier than most shops I’ve used.",
    initial: "L",
    name: "Mei L.",
    role: "Registered dietitian",
  },
] as const;

export function TestimonialsSection() {
  return (
    <section className="border-b border-[var(--border)] py-16 sm:py-20" aria-labelledby="testimonials-heading">
      <Container>
        <h2 id="testimonials-heading" className="text-center text-2xl font-semibold sm:text-3xl">
          What customers say
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-[var(--muted-foreground)]">
          Real feedback from people who value transparency and a smooth shopping experience.
        </p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <li key={t.name} className="h-full list-none">
              <Card className="flex h-full flex-col">
                <CardContent className="flex flex-1 flex-col pt-6">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-lg font-semibold text-[var(--primary)]"
                    aria-hidden
                  >
                    {t.initial}
                  </div>
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
      </Container>
    </section>
  );
}
