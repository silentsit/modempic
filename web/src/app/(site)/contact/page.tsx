import type { Metadata } from "next";
import { ContactForm } from "./ui";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach Modempic support and team.",
};

export default function ContactPage() {
  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact</h1>
      <p className="mt-2 text-[var(--muted-foreground)]">
        Email:{" "}
        <a href="mailto:support@modempic.com" className="text-[var(--primary)] hover:underline">
          support@modempic.com
        </a>
      </p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">We reply by email. No medical advice by message.</p>
      <div className="mt-8 max-w-lg">
        <ContactForm />
      </div>
    </Container>
  );
}
