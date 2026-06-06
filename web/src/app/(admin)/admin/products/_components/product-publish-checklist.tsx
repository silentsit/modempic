"use client";

import { ProductStatus } from "@prisma/client";
import { productPublishChecklist } from "@/lib/admin/product-publish-readiness";

export function ProductPublishChecklist({
  status,
  seoTitle,
  seoDesc,
  disclaimer,
  coaUrl,
  categorySlugs,
  featuredImageUrl,
  featuredImageAlt,
  galleryUrls,
  galleryAlts,
  productType,
  tierCount,
}: {
  status: string;
  seoTitle: string;
  seoDesc: string;
  disclaimer: string;
  coaUrl: string;
  categorySlugs: string[];
  featuredImageUrl: string;
  featuredImageAlt: string;
  galleryUrls: string;
  galleryAlts: string;
  productType: "simple" | "variable";
  tierCount: number;
}) {
  const publishing = status === ProductStatus.PUBLISHED;
  const items = productPublishChecklist({
    status,
    seoTitle,
    seoDesc,
    disclaimer,
    coaUrl,
    categorySlugs,
    featuredImageUrl,
    featuredImageAlt,
    galleryUrls,
    galleryAlts,
    productType,
    tierCount,
  });

  const requiredItems = items.filter((i) => i.required || publishing);
  const ready = requiredItems.every((i) => i.ok);

  return (
    <div className="mt-4 rounded-lg border border-[#dcdcde] bg-[#f6f7f7] p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#50575e]">Publish checklist</h3>
        {publishing ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
              ready ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"
            }`}
          >
            {ready ? "Ready" : "Incomplete"}
          </span>
        ) : (
          <span className="text-[10px] font-medium uppercase text-[#646970]">Draft mode</span>
        )}
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-xs text-[#1d2327]">
            <span
              className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                item.ok ? "bg-green-600 text-white" : item.required && publishing ? "bg-amber-500 text-white" : "bg-[#dcdcde] text-[#50575e]"
              }`}
              aria-hidden
            >
              {item.ok ? "✓" : "·"}
            </span>
            <span className={!item.ok && item.required && publishing ? "font-medium" : ""}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
