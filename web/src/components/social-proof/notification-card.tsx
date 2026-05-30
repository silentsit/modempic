"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Shield, ShieldCheck, Star, Truck, X } from "lucide-react";
import { formatAggregateWindow } from "@/lib/social-proof/display-count";
import { formatTimeAgo } from "@/lib/social-proof/format-time-ago";
import type { SocialProofNotificationConfig } from "@/lib/social-proof/schema";
import type { SocialProofSlide } from "@/lib/social-proof/slides";

function avatarLetter(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const ch = t.charAt(0).toUpperCase();
  return /[A-Z0-9]/i.test(ch) ? ch : "?";
}

function InfoIcon({ icon }: { icon?: "shield" | "truck" | "star" }) {
  const cls = "h-5 w-5 shrink-0 text-sky-700 dark:text-sky-400";
  if (icon === "truck") return <Truck className={cls} aria-hidden />;
  if (icon === "star") return <Star className={cls} aria-hidden />;
  return <Shield className={cls} aria-hidden />;
}

type NotificationCardProps = {
  slide: SocialProofSlide;
  cfg: SocialProofNotificationConfig;
  brandLabel: string;
  comboMessage?: string;
  onDismiss?: () => void;
  onCardClick?: () => void;
  preview?: boolean;
};

function CardShell({
  cfg,
  onDismiss,
  onCardClick,
  preview,
  children,
  href,
  clickable,
}: {
  cfg: SocialProofNotificationConfig;
  onDismiss?: () => void;
  onCardClick?: () => void;
  preview?: boolean;
  children: ReactNode;
  href?: string | null;
  clickable?: boolean;
}) {
  const inner = (
    <div
      className={`flex max-w-[min(92vw,22rem)] items-stretch gap-3 border border-[var(--border)] bg-[var(--background)] py-3 pl-3 pr-2 shadow-2xl ${
        clickable && href ? "transition-colors hover:bg-[var(--muted)]/40" : ""
      }`}
      style={{ borderRadius: cfg.roundedPx }}
    >
      {children}
      {cfg.dismissible && onDismiss && !preview ? (
        <button
          type="button"
          className="self-start rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          aria-label="Hide notifications for a few hours"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );

  if (clickable && href) {
    return (
      <Link
        href={href}
        className="block no-underline text-inherit"
        onClick={() => {
          onCardClick?.();
        }}
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function VerifiedFooter({ brandLabel }: { brandLabel: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-400">
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="font-medium">Verified · {brandLabel}</span>
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-current" : "fill-none opacity-30"}`} aria-hidden />
      ))}
    </span>
  );
}

export function NotificationCard({
  slide,
  cfg,
  brandLabel,
  comboMessage,
  onDismiss,
  onCardClick,
  preview,
}: NotificationCardProps) {
  if (slide.kind === "combo") {
    const label = comboMessage?.trim() || "visited our store";
    const windowLabel = formatAggregateWindow(slide.hours);
    return (
      <CardShell cfg={cfg} onDismiss={onDismiss} onCardClick={onCardClick} preview={preview}>
        <div className="flex min-w-0 flex-1 items-center gap-3 py-0.5">
          <p className="shrink-0 text-3xl font-bold leading-none text-[var(--primary)]">{slide.count}</p>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug text-[var(--foreground)]">
              people {label} in the last {windowLabel}
            </p>
            <div className="mt-2 text-xs text-[var(--muted-foreground)]">
              <VerifiedFooter brandLabel={brandLabel} />
            </div>
          </div>
        </div>
      </CardShell>
    );
  }

  if (slide.kind === "purchase_aggregate") {
    const href = cfg.clickable && slide.productSlug ? `/product/${slide.productSlug}` : null;
    const showImage = cfg.showProductImage && slide.productImageUrl;
    return (
      <CardShell
        cfg={cfg}
        onDismiss={onDismiss}
        onCardClick={onCardClick}
        preview={preview}
        href={href}
        clickable={!!href}
      >
        {showImage ? (
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[var(--muted)]" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.productImageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-base font-semibold text-sky-900 dark:bg-sky-950/50 dark:text-sky-100"
            aria-hidden
          >
            {slide.count}
          </div>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium leading-snug text-[var(--foreground)]">
            <span className="font-bold text-[var(--primary)]">{slide.count}</span> people purchased
          </p>
          <p className="mt-0.5 truncate font-semibold leading-tight text-[var(--foreground)]">{slide.productHint}</p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">in the last {slide.windowLabel}</p>
          <div className="mt-2 text-xs text-[var(--muted-foreground)]">
            <VerifiedFooter brandLabel={brandLabel} />
          </div>
        </div>
      </CardShell>
    );
  }

  if (slide.kind === "informational") {
    const href = slide.linkUrl?.trim() || null;
    return (
      <CardShell
        cfg={cfg}
        onDismiss={onDismiss}
        onCardClick={onCardClick}
        preview={preview}
        href={href}
        clickable={cfg.clickable && !!href}
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-950/50"
          aria-hidden
        >
          <InfoIcon icon={slide.icon} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-semibold leading-tight text-[var(--foreground)]">{slide.title}</p>
          <p className="mt-0.5 text-sm leading-snug text-[var(--muted-foreground)]">{slide.body}</p>
          <div className="mt-2 text-xs text-[var(--muted-foreground)]">
            <VerifiedFooter brandLabel={brandLabel} />
          </div>
        </div>
      </CardShell>
    );
  }

  if (slide.kind === "counter") {
    return (
      <CardShell cfg={cfg} onDismiss={onDismiss} preview={preview}>
        <div className="flex min-w-0 flex-1 items-center gap-3 py-0.5">
          <p className="shrink-0 text-3xl font-bold leading-none text-[var(--primary)]">{slide.count}</p>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug text-[var(--foreground)]">{slide.message}</p>
            <div className="mt-2 text-xs text-[var(--muted-foreground)]">
              <VerifiedFooter brandLabel={brandLabel} />
            </div>
          </div>
        </div>
      </CardShell>
    );
  }

  if (slide.kind === "review") {
    const review = slide.review;
    const href =
      cfg.clickable && review.productSlug ? `/product/${review.productSlug}#reviews` : null;
    const showImage = cfg.showProductImage && review.productImageUrl;
    return (
      <CardShell
        cfg={cfg}
        onDismiss={onDismiss}
        onCardClick={onCardClick}
        preview={preview}
        href={href}
        clickable={!!href}
      >
        {showImage ? (
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[var(--muted)]" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={review.productImageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-base font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
            aria-hidden
          >
            {avatarLetter(review.authorName)}
          </div>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate font-semibold leading-tight text-[var(--foreground)]">{review.authorName}</p>
          <StarRating rating={review.rating} />
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-[var(--muted-foreground)]">
            {review.title ? `${review.title} — ` : ""}
            {review.excerpt}
          </p>
          <div className="mt-2 text-xs text-[var(--muted-foreground)]">
            <VerifiedFooter brandLabel={brandLabel} />
          </div>
        </div>
      </CardShell>
    );
  }

  if (slide.kind !== "activity") return null;

  const item = slide.item;
  const relativeLabel =
    item.timeLabel ??
    (() => {
      try {
        return formatTimeAgo(item.completedAtIso);
      } catch {
        return "";
      }
    })();

  const showImage = cfg.showProductImage && item.productImageUrl;
  const href = cfg.clickable && item.productSlug ? `/product/${item.productSlug}` : null;

  return (
    <CardShell cfg={cfg} onDismiss={onDismiss} onCardClick={onCardClick} preview={preview} href={href} clickable={!!href}>
      {showImage ? (
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[var(--muted)]" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.productImageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-base font-semibold text-sky-900 dark:bg-sky-950/50 dark:text-sky-100"
          aria-hidden
        >
          {avatarLetter(item.displayName)}
        </div>
      )}
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="truncate text-sm leading-snug text-[var(--foreground)]">
          <span className="font-semibold">{item.displayName}</span>
          {cfg.showLocation && item.locationLine ? (
            <span className="font-normal text-[var(--muted-foreground)]"> from {item.locationLine}</span>
          ) : null}{" "}
          <span className="text-[var(--muted-foreground)]">{item.actionLine}</span>
        </p>
        {item.productHint ? (
          <p className="mt-0.5 truncate font-semibold leading-tight text-[var(--foreground)]">{item.productHint}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--muted-foreground)]">
          {relativeLabel ? <span>{relativeLabel}</span> : null}
          {relativeLabel ? <span aria-hidden>·</span> : null}
          <VerifiedFooter brandLabel={brandLabel} />
        </div>
      </div>
    </CardShell>
  );
}

export function samplePreviewSlide(
  type: "stream" | "combo" | "informational" | "reviews" | "counter",
): SocialProofSlide {
  if (type === "counter") {
    return { kind: "counter", key: "preview-counter", count: 127, message: "visitors are online" };
  }
  if (type === "reviews") {
    return {
      kind: "review",
      key: "preview-review",
      review: {
        id: "preview",
        authorName: "Alex M.",
        rating: 5,
        title: "Great quality",
        excerpt: "Exactly what I was looking for — fast shipping too.",
        productName: "Example product",
        productSlug: "example-product",
        createdAtIso: new Date().toISOString(),
      },
    };
  }
  if (type === "combo") {
    return { kind: "combo", key: "preview-combo", count: 247, hours: 24 };
  }
  if (type === "informational") {
    return {
      kind: "informational",
      key: "preview-info",
      title: "Free US shipping",
      body: "On orders $50 and over.",
      icon: "truck",
    };
  }
  return {
    kind: "activity",
    key: "preview-activity",
    item: {
      message: "Jordan R. from Austin, TX just purchased",
      completedAtIso: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      timeLabel: "45 min ago",
      displayName: "Jordan R.",
      actionLine: "just purchased",
      locationLine: "Austin, TX",
      productHint: "Example product",
      productSlug: "example-product",
    },
  };
}
