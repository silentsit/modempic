import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "./ui";

export const metadata: Metadata = {
  title: "Set new password",
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  return (
    <div className="w-full max-w-md px-4">
      <h1 className="text-2xl font-semibold">New password</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">Choose a strong password you haven&apos;t used elsewhere.</p>
      <ResetForm searchParams={searchParams} />
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-[var(--primary)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
