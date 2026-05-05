import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./ui";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Modempic account",
};

type Search = { callbackUrl?: string };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Search> }) {
  const showGoogle = Boolean(process.env.GOOGLE_CLIENT_ID);
  const sp = await searchParams;
  const registerHref = sp.callbackUrl
    ? `/register?callbackUrl=${encodeURIComponent(sp.callbackUrl)}`
    : "/register";
  return (
    <div className="w-full max-w-md px-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        No guest checkout — sign in or create an account to place your order.
      </p>
      <LoginForm showGoogle={showGoogle} />
      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        New here?{" "}
        <Link href={registerHref} className="text-[var(--primary)] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
