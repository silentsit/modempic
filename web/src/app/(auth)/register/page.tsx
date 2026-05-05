import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./ui";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Modempic account",
};

type Search = { callbackUrl?: string };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Search> }) {
  const showGoogle = Boolean(process.env.GOOGLE_CLIENT_ID);
  const sp = await searchParams;
  const loginHref = sp.callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(sp.callbackUrl)}`
    : "/login";
  return (
    <div className="w-full max-w-md px-4">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">Set up your account to shop and track orders.</p>
      <RegisterForm showGoogle={showGoogle} />
      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link href={loginHref} className="text-[var(--primary)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
