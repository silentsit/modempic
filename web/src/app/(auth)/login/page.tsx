import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./ui";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Modempic account",
};

export default function LoginPage() {
  const showGoogle = Boolean(process.env.GOOGLE_CLIENT_ID);
  return (
    <div className="w-full max-w-md px-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        No guest checkout — create an account to place an order.
      </p>
      <LoginForm showGoogle={showGoogle} />
      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        New here?{" "}
        <Link href="/register" className="text-[var(--primary)] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
