import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { GuaranteedSafeCheckout } from "@/components/shop/guaranteed-safe-checkout";
import { ProductInternalLinks } from "@/components/shop/product-internal-links";
import { ProductPurchaseSection } from "@/components/shop/product-purchase-section";
import { ProductReviewSummary } from "@/components/shop/product-review-summary";
import { ProductRuoBanner } from "@/components/shop/product-ruo-banner";
import { ProductTestingCoaStrip } from "@/components/shop/product-testing-coa-strip";
import { ProductTrustBullets } from "@/components/shop/product-trust-bullets";
import type { VariantTier } from "@/lib/product-variants";

export const metadata: Metadata = {
  title: "Peptide PDP preview",
  robots: { index: false, follow: false },
};

const MOCK_NAME = "BPC-157 5 mg (research grade)";
const MOCK_SLUG = "preview-bpc-157";
const MOCK_PRICE = "$89";
const MOCK_TIERS: VariantTier[] = [
  { label: "1 vial", priceCents: 8900 },
  { label: "3 vials", priceCents: 24900, compareAtCents: 26700 },
  { label: "5 vials", priceCents: 39900, compareAtCents: 44500 },
];

export default function PeptidePdpPreviewPage() {
  return (
    <Container className="pb-24 py-10 sm:pb-14 sm:py-14 lg:pb-14">
      <div className="rounded-xl border border-dashed border-sky-400 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-100">
        <p className="font-semibold">Design preview — peptides category is not live yet</p>
        <p className="mt-1 text-sky-900/90 dark:text-sky-100/90">
          This page shows how RUO, testing/COA, and research links will appear on peptide PDPs when{" "}
          <code className="rounded bg-white/60 px-1 py-0.5 text-xs dark:bg-black/30">PEPTIDES_CATEGORY_LAUNCHED</code>{" "}
          is enabled.{" "}
          <Link href="/shop/modafinil" className="font-medium underline-offset-2 hover:underline">
            Back to live catalog
          </Link>
        </p>
      </div>

      <div className="mt-6">
        <ProductRuoBanner />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="flex aspect-square items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40 text-sm text-[var(--muted-foreground)]">
          Product image placeholder
        </div>

        <div className="flex flex-col lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Peptides</p>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[var(--hero)] sm:text-4xl">{MOCK_NAME}</h1>

          <ProductReviewSummary reviewCount={12} averageRating={4.7} />

          <div className="mt-6 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-[var(--foreground)]">{MOCK_PRICE}</span>
            <span className="text-sm text-[var(--muted-foreground)]">from 3 pack options</span>
          </div>

          <p className="mt-5 text-base leading-relaxed text-[var(--foreground)]">
            Lyophilized peptide for qualified laboratory research. Includes batch documentation and handling notes where
            provided.
          </p>

          <ProductTrustBullets />

          <ProductTestingCoaStrip
            purity="≥ 98% (HPLC)"
            testingStatus="Third-party tested — batch COA available"
            coaUrl="https://example.com/coa-preview.pdf"
          />

          <ProductInternalLinks
            categoryHref="/shop/peptides"
            categoryLabel="Peptides"
            hasResearchDetails
            showResearchResources
          />

          <ProductPurchaseSection
            slug={MOCK_SLUG}
            tiers={MOCK_TIERS}
            productName={MOCK_NAME}
            headlinePrice={MOCK_PRICE}
          />

          <GuaranteedSafeCheckout />

          <p className="mt-6 text-xs leading-relaxed text-[var(--muted-foreground)]">
            For research use only. Not for human consumption, clinical use, or personal treatment. Purchaser assumes
            responsibility for compliance with applicable laws.
          </p>
        </div>
      </div>

      <section
        id="documentation"
        className="mt-12 scroll-mt-28 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Research-use details</p>
        <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[var(--hero)]">
          Product documentation and handling notes
        </h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Storage</dt>
            <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">Store lyophilized at −20 °C; reconstituted aliquots refrigerated.</dd>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Shipping</dt>
            <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">Cold-chain where required; see product label.</dd>
          </div>
        </dl>
      </section>
    </Container>
  );
}
