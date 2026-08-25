import Link from "next/link";
import { BadgeCheck, Quote, Star } from "lucide-react";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/home/reveal";
import { Badge } from "@/components/ui/badge";
import { getHomepageTestimonials, type HomepageTestimonial } from "@/lib/home/testimonials";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-border"
          }`}
          aria-hidden
        />
      ))}
    </div>
  );
}

function Attribution({ item }: { item: HomepageTestimonial }) {
  return (
    <footer className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {item.name}
          <BadgeCheck className="h-4 w-4 text-primary" aria-label="Approved review" />
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">Approved product review</p>
      </div>
      <Link
        href={`/product/${item.productSlug}#reviews`}
        className="max-w-40 text-right text-xs font-medium leading-5 text-primary underline-offset-4 hover:underline"
      >
        {item.productName}
      </Link>
    </footer>
  );
}

export async function TestimonialsSection() {
  const items = await getHomepageTestimonials(5);
  if (items.length === 0) return null;

  const [featured, ...supporting] = items;

  return (
    <section
      className="border-b border-border bg-[linear-gradient(180deg,var(--background),color-mix(in_srgb,var(--muted)_35%,var(--background)))] py-16 sm:py-20"
      aria-labelledby="testimonials-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-3xl text-center">
          <Badge className="mx-auto">Customer feedback</Badge>
          <h2
            id="testimonials-heading"
            className="mt-3 text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            What Customers Say About Ordering From Modempic
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
            Approved product reviews covering service, delivery, and the products customers ordered.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          <Reveal>
            <blockquote className="relative flex h-full min-h-72 flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card p-7 shadow-[var(--shadow-card)] sm:p-9">
              <Quote className="absolute -right-3 -top-4 h-28 w-28 text-primary/10" aria-hidden />
              <Stars rating={featured.rating} />
              <p className="relative mt-6 flex-1 text-lg leading-8 text-foreground sm:text-xl">
                &ldquo;{featured.quote}&rdquo;
              </p>
              <Attribution item={featured} />
            </blockquote>
          </Reveal>

          <ul className="grid gap-5 sm:grid-cols-2">
            {supporting.map((item) => (
              <li key={item.id} className="list-none">
                <Reveal className="h-full">
                  <blockquote className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                    <Stars rating={item.rating} />
                    <p className="mt-4 flex-1 text-sm leading-6 text-foreground">&ldquo;{item.quote}&rdquo;</p>
                    <Attribution item={item} />
                  </blockquote>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
