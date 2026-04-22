import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./ui";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md px-4">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">We&apos;ll email you a secure link if your address is on file.</p>
      <ForgotForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-[var(--primary)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
