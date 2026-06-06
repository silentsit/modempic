import { FlaskConical } from "lucide-react";

/** Shown on peptide category PDPs only — see `productInPeptidesCategory`. */
export function ProductRuoBanner() {
  return (
    <div
      role="note"
      className="rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3.5 shadow-sm dark:border-amber-800/60 dark:bg-amber-950/35"
    >
      <div className="flex gap-3">
        <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-amber-800 dark:text-amber-200" strokeWidth={2} aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-50">Research use only (RUO)</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90 dark:text-amber-100/90">
            For qualified laboratory and research purposes. Not for human consumption, clinical use, diagnosis, or
            personal treatment. Purchasers must comply with applicable laws and institutional requirements.
          </p>
        </div>
      </div>
    </div>
  );
}
