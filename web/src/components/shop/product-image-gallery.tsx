"use client";

import { useCallback, useState } from "react";
import { productImageDeliveryUrl } from "@/lib/cloudinary-delivery-url";

export type GalleryImage = { id: string; url: string; alt: string };

export function ProductImageGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [selected, setSelected] = useState(0);
  const [failedMain, setFailedMain] = useState(false);
  const [failedThumb, setFailedThumb] = useState<Record<string, boolean>>({});

  const safe = images.length > 0 ? images : [];
  const main = safe[selected] ?? safe[0];

  const showThumbs = safe.length > 1;

  const goTo = useCallback(
    (index: number) => {
      setFailedMain(false);
      setSelected(Math.max(0, Math.min(index, safe.length - 1)));
    },
    [safe.length],
  );

  if (!main) return null;

  return (
    <div className="space-y-4">
      <div className="group relative aspect-square overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted)]">
        <div className="relative h-full w-full cursor-zoom-in overflow-hidden">
          <div className="absolute inset-0 origin-center transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.12] motion-reduce:transform-none">
            {failedMain ? (
              <div className="flex h-full min-h-[200px] items-center justify-center px-4 text-center text-sm text-[var(--muted-foreground)]">
                Image unavailable
              </div>
            ) : (
              // Native img avoids Next/Image optimizer edge cases that can surface as unhandled rejections ([object Event]) on bad/missing URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productImageDeliveryUrl(main.url, "galleryMain")}
                alt={main.alt || productName}
                className="h-full w-full object-cover"
                loading={selected === 0 ? "eager" : "lazy"}
                decoding="async"
                onError={() => setFailedMain(true)}
              />
            )}
          </div>
        </div>
      </div>

      {showThumbs ? (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label="Product images">
          {safe.map((im, index) => {
            const isActive = index === selected;
            const thumbFailed = failedThumb[im.id];
            return (
              <li key={im.id}>
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  className={`group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg border-2 bg-[var(--muted)] transition-[border-color,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${
                    isActive
                      ? "border-[var(--primary)] shadow-sm ring-1 ring-[var(--primary)]/30"
                      : "border-[var(--border)] hover:border-[var(--muted-foreground)]/40"
                  }`}
                  aria-label={`Show image ${index + 1} of ${safe.length}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                    {thumbFailed ? (
                      <span className="flex h-full items-center justify-center bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
                        —
                      </span>
                    ) : (
                      <span className="absolute inset-0 origin-center transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.12] group-focus-within:scale-[1.12] motion-reduce:transform-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={productImageDeliveryUrl(im.url, "galleryThumb")}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={() => setFailedThumb((prev) => ({ ...prev, [im.id]: true }))}
                        />
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
