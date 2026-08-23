import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you requested could not be found on Modempic.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Page not found</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The link may be outdated or the page may have moved. Browse the shop or contact support if you need help.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/shop">Browse shop</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/faq">View FAQ</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/contact">Contact support</Link>
        </Button>
      </div>
    </Container>
  );
}
