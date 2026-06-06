import { FileCheck2, Microscope } from "lucide-react";
import { SafeLink } from "@/components/site/safe-link";

export function ProductTestingCoaStrip({
  purity,
  testingStatus,
  coaUrl,
}: {
  purity: string | null;
  testingStatus: string | null;
  coaUrl: string | null;
}) {
  if (!purity && !testingStatus && !coaUrl) return null;

  return (
    <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Microscope className="h-5 w-5 shrink-0 text-[var(--primary)]" strokeWidth={2} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">Testing & documentation</p>
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            {purity ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Purity</dt>
                <dd className="mt-0.5 font-medium text-[var(--foreground)]">{purity}</dd>
              </div>
            ) : null}
            {testingStatus ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Testing</dt>
                <dd className="mt-0.5 font-medium text-[var(--foreground)]">{testingStatus}</dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {coaUrl ? (
              <a
                href={coaUrl}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                <FileCheck2 className="h-4 w-4" aria-hidden />
                View certificate of analysis
              </a>
            ) : null}
            <SafeLink
              href="/research/testing-coa"
              className="text-xs text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
            >
              How we document testing
            </SafeLink>
          </div>
        </div>
      </div>
    </div>
  );
}
