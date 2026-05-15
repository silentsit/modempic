"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminCouponsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin coupons page error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-950">
      <h2 className="text-lg font-semibold">Coupons could not load</h2>
      <p className="mt-2">
        This usually means the production database is missing the coupon rules migration (
        <code className="rounded bg-red-100 px-1">20260515120000_coupon_rules</code>). Redeploy after
        confirming <code className="rounded bg-red-100 px-1">DATABASE_URL</code> is set on Vercel, or run{" "}
        <code className="rounded bg-red-100 px-1">npm run db:migrate:deploy</code> locally against production.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-red-800">
          Digest: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-red-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-900"
        >
          Try again
        </button>
        <Link
          href="/admin"
          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-red-100"
        >
          Back to admin
        </Link>
      </div>
    </div>
  );
}
