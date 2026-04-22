import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./ui";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Modempic account",
};

export default function RegisterPage() {
  const showGoogle = Boolean(process.env.GOOGLE_CLIENT_ID);
  return (
    <div className="w-full max-w-md px-4">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">Set up your account to shop and track orders.</p>
      <RegisterForm showGoogle={showGoogle} />
      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--primary)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
