"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, Flame, Shield, Star, Truck, X } from "lucide-react";
import {
  clampSocialProofDisplayCount,
  clampSocialProofViewerCount,
  formatAggregateWindow,
} from "@/lib/social-proof/display-count";
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
  const cls = "h-5 w-5 shrink-0 text-[#3b82f6]";
  if (icon === "truck") return <Truck className={cls} aria-hidden />;
  if (icon === "star") return <Star className={cls} aria-hidden />;
  return <Shield className={cls} aria-hidden />;
}

type NotificationCardProps = {
  slide: SocialProofSlide;
  cfg: SocialProofNotificationConfig;
  brandLabel: string;
  dataSource?: "real" | "demo" | "synthetic" | "none";
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
      className={`relative flex max-w-[min(92vw,24rem)] items-start gap-3 border border-[#e5e7eb] bg-white py-3 pl-3.5 pr-3 shadow-[0_8px_28px_rgba(15,23,42,0.12)] ${
        clickable && href ? "transition-colors hover:bg-slate-50" : ""
      }`}
      style={{ borderRadius: 999 }}
    >
      {children}
      {cfg.dismissible && onDismiss && !preview ? (
        <button
          type="button"
          className="self-start rounded-full p-1 text-[#94a3b8] hover:bg-slate-100 hover:text-[#334155]"
          aria-label="Hide notifications for a few hours"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
        >
          <X className="h-3.5 w-3.5" />
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

function BrandMark() {
  return (
    <span
      className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white"
      aria-hidden
    >
      <Check className="h-2.5 w-2.5" strokeWidth={3} />
    </span>
  );
}

function PoweredFooter({ brandLabel }: { brandLabel: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] leading-none text-[#94a3b8]">
      Powered by
      <BrandMark />
      <span className="font-semibold text-[#1e3a8a]">{brandLabel.toLowerCase()}</span>
    </span>
  );
}

function BylineFooter({
  brandLabel,
  timeLabel,
}: {
  brandLabel: string;
  timeLabel?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] leading-none text-[#94a3b8]">
      {timeLabel ? <span>{timeLabel}</span> : null}
      {timeLabel ? <span aria-hidden>|</span> : null}
      <BrandMark />
      <span>
        by <span className="font-medium text-[#2563eb]">{brandLabel}</span>
      </span>
    </span>
  );
}

function FlameAvatar() {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ffedd5]"
      aria-hidden
    >
      <Flame className="h-6 w-6 fill-[#f97316] text-[#ea580c]" strokeWidth={1.75} />
    </div>
  );
}

function LetterAvatar({ name }: { name: string }) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8eef4] text-lg font-semibold text-[#334155]"
      aria-hidden
    >
      {avatarLetter(name)}
    </div>
  );
}

function PersonAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (avatarUrl?.trim() && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote social-proof headshots
      <img
        src={avatarUrl}
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 shrink-0 rounded-full border border-[#e5e7eb] object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setImageFailed(true)}
      />
    );
  }
  return <LetterAvatar name={name} />;
}

function TwoLineCopy({ children }: { children: ReactNode }) {
  return <p className="line-clamp-2 text-[13px] leading-snug text-[#1e293b]">{children}</p>;
}

function CountCopy({
  count,
  rest,
}: {
  count: number;
  rest: string;
}) {
  return (
    <TwoLineCopy>
      <span className="font-bold text-[#ea580c]">{count} people</span> {rest}
    </TwoLineCopy>
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
  const peopleCount = (raw: number) => clampSocialProofDisplayCount(raw);

  if (slide.kind === "combo") {
    const count = peopleCount(slide.count);
    const windowLabel = slide.windowLabel ?? formatAggregateWindow(slide.hours);
    const href = cfg.clickable && slide.productSlug ? `/product/${slide.productSlug}` : null;
    const label = comboMessage?.trim() || "visited our store";
    const rest = slide.productHint
      ? `purchased ${slide.productHint} in the last ${windowLabel}`
      : `${label} in the last ${windowLabel}`;

    return (
      <CardShell
        cfg={cfg}
        onDismiss={onDismiss}
        onCardClick={onCardClick}
        preview={preview}
        href={href}
        clickable={!!href}
      >
        <FlameAvatar />
        <div className="min-w-0 flex-1">
          <CountCopy count={count} rest={rest} />
          <div className="mt-1.5">
            <PoweredFooter brandLabel={brandLabel} />
          </div>
        </div>
      </CardShell>
    );
  }

  if (slide.kind === "purchase_aggregate") {
    const count = peopleCount(slide.count);
    const href = cfg.clickable && slide.productSlug ? `/product/${slide.productSlug}` : null;
    return (
      <CardShell
        cfg={cfg}
        onDismiss={onDismiss}
        onCardClick={onCardClick}
        preview={preview}
        href={href}
        clickable={!!href}
      >
        <FlameAvatar />
        <div className="min-w-0 flex-1">
          <CountCopy
            count={count}
            rest={`purchased ${slide.productHint} in the last ${slide.windowLabel}`}
          />
          <div className="mt-1.5">
            <PoweredFooter brandLabel={brandLabel} />
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
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8eef4]"
          aria-hidden
        >
          <InfoIcon icon={slide.icon} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-tight text-[#1e293b]">{slide.title}</p>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#64748b]">{slide.body}</p>
          <div className="mt-1.5">
            <PoweredFooter brandLabel={brandLabel} />
          </div>
        </div>
      </CardShell>
    );
  }

  if (slide.kind === "counter") {
    const count = clampSocialProofViewerCount(slide.count);
    const peopleLead = /^people\b/i.test(slide.message);
    return (
      <CardShell cfg={cfg} onDismiss={onDismiss} preview={preview}>
        <FlameAvatar />
        <div className="min-w-0 flex-1">
          {peopleLead ? (
            <CountCopy count={count} rest={slide.message.replace(/^people\s+/i, "")} />
          ) : (
            <TwoLineCopy>
              <span className="font-bold text-[#ea580c]">{count}</span> {slide.message}
            </TwoLineCopy>
          )}
          <div className="mt-1.5">
            <PoweredFooter brandLabel={brandLabel} />
          </div>
        </div>
      </CardShell>
    );
  }

  if (slide.kind === "review") {
    const review = slide.review;
    const href = cfg.clickable && review.productSlug ? `/product/${review.productSlug}#reviews` : null;
    return (
      <CardShell
        cfg={cfg}
        onDismiss={onDismiss}
        onCardClick={onCardClick}
        preview={preview}
        href={href}
        clickable={!!href}
      >
        <PersonAvatar name={review.authorName} avatarUrl={review.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold leading-tight text-[#1e293b]">{review.authorName}</p>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#64748b]">
            {review.title ? `${review.title} — ` : ""}
            {review.excerpt}
          </p>
          <div className="mt-1.5">
            <BylineFooter brandLabel={brandLabel} />
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

  const href = cfg.clickable && item.productSlug ? `/product/${item.productSlug}` : null;
  const actionBits = [
    cfg.showLocation && item.locationLine ? `from ${item.locationLine}` : null,
    item.actionLine,
    item.productHint,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <CardShell cfg={cfg} onDismiss={onDismiss} onCardClick={onCardClick} preview={preview} href={href} clickable={!!href}>
      <PersonAvatar name={item.displayName} avatarUrl={item.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold leading-tight text-[#1e293b]">{item.displayName}</p>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#64748b]">{actionBits}</p>
        <div className="mt-1.5">
          <BylineFooter brandLabel={brandLabel} timeLabel={relativeLabel || undefined} />
        </div>
      </div>
    </CardShell>
  );
}

export function samplePreviewSlide(
  type: "stream" | "combo" | "informational" | "reviews" | "counter",
): SocialProofSlide {
  if (type === "counter") {
    return { kind: "counter", key: "preview-counter", count: 14, message: "people viewing this page" };
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
    return {
      kind: "combo",
      key: "preview-combo-product",
      count: 24,
      hours: 168,
      windowLabel: "7 days",
      productHint: "Artvigil 150mg",
      productSlug: "artvigil-150mg",
    };
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
      message: "Jordan R. from United States, TX just purchased",
      completedAtIso: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      timeLabel: "45 min ago",
      displayName: "Jordan R.",
      actionLine: "just purchased",
      locationLine: "United States, TX",
      productHint: "Example product",
      productSlug: "example-product",
      avatarUrl: "https://i.pravatar.cc/128?img=12",
    },
  };
}
