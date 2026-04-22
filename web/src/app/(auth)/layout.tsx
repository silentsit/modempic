import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { Container } from "@/components/site/container";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <header className="border-b border-[var(--border)] py-4">
        <Container className="flex justify-center">
          <Link href="/" className="text-lg">
            <Logo />
          </Link>
        </Container>
      </header>
      <div className="flex flex-1 items-center justify-center py-10">{children}</div>
    </div>
  );
}
