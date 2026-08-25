import Link from "next/link";
import { Star } from "lucide-react";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/home/reveal";
import { getHomepageTestimonials, type HomepageTestimonial } from "@/lib/home/testimonials";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-border"
          }`}
          aria-hidden
        />
      ))}
    </div>
  );
}

function TestimonialCard({ item }: { item: HomepageTestimonial }) {
  return (
    <blockquote className="flex h-full flex-col rounded-xl border border-border bg-card p-5">
      <Stars rating={item.rating} />
      <p className="mt-4 flex-1 text-sm leading-6 text-foreground">&quot;{item.quote}&quot;</p>
      <footer className="mt-5 border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">{item.name}</p>
        <Link
          href={`/product/${item.productSlug}#reviews`}
          className="mt-1 block truncate text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          {item.productName}
        </Link>
      </footer>
    </blockquote>
  );
}

export async function TestimonialsSection() {
  const items = await getHomepageTestimonials(5);
  if (items.length === 0) return null;

  return (
    <section className="border-b border-border bg-background py-14 sm:py-16" aria-labelledby="testimonials-heading">
      <Container>
        <Reveal className="max-w-2xl">
          <h2
            id="testimonials-heading"
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            What customers said after they ordered
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pulled from approved product reviews. Mostly shipping, packing, and whether the order showed up.
          </p>
        </Reveal>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item) => (
            <li key={item.id} className="list-none">
              <Reveal className="h-full">
                <TestimonialCard item={item} />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
