"use client";

import { useActionState, useState } from "react";
import { submitProductReviewAction, type SubmitReviewState } from "@/lib/actions/review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ProductAddReviewForm({
  productId,
  productSlug,
  onCancel,
}: {
  productId: string;
  productSlug: string;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(submitProductReviewAction, null as SubmitReviewState);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  if (state?.success) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
        {state.success}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--foreground)]">Write a review</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-[var(--muted-foreground)] underline-offset-2 hover:underline"
        >
          Cancel
        </button>
      </div>

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productSlug" value={productSlug} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <Label className="text-sm font-medium">Your rating</Label>
        <div className="mt-2 flex items-center gap-1" role="group" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= (hoverRating || rating);
            return (
              <button
                key={star}
                type="button"
                className={cn(
                  "text-2xl leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
                  active ? "text-amber-400" : "text-neutral-300 dark:text-neutral-600",
                )}
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="review-title">Review title (optional)</Label>
        <Input id="review-title" name="title" maxLength={120} className="mt-1.5" placeholder="Summarize your experience" />
      </div>

      <div>
        <Label htmlFor="review-body">Your review</Label>
        <Textarea
          id="review-body"
          name="body"
          required
          minLength={10}
          maxLength={5000}
          rows={4}
          className="mt-1.5"
          placeholder="Share what you liked or what could be better."
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
