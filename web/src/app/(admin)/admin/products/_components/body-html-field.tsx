"use client";

import { useId, useState } from "react";
import { sanitizeProductBodyHtml } from "@/lib/product-html";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function BodyHtmlField({ defaultValue }: { defaultValue: string }) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [showPreview, setShowPreview] = useState(false);
  const safe = value.trim() ? sanitizeProductBodyHtml(value) : "";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>Body HTML (optional)</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview((s) => !s)}>
          {showPreview ? "Edit HTML" : "Preview (sanitized)"}
        </Button>
      </div>
      <p className="mt-1 text-xs text-[#50575e]">
        Shown in the product “Details” tab. Scripts are stripped on save (same rules as the storefront).
      </p>
      {showPreview ? (
        <div
          className="mt-2 max-w-none space-y-2 rounded-lg border border-[#dcdcde] bg-white p-4 text-sm leading-relaxed text-[#1d2327] [&_a]:text-[#2271b1] [&_img]:max-h-48 [&_img]:rounded-md [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:bg-[#f6f7f7] [&_th]:p-2 [&_td]:p-2"
          dangerouslySetInnerHTML={{ __html: safe || "<p class=\"text-[#50575e]\">Nothing to preview.</p>" }}
        />
      ) : null}
      <Textarea
        id={id}
        name="bodyHtml"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={showPreview ? "sr-only" : "mt-2 font-mono text-sm"}
        rows={showPreview ? 1 : 8}
        readOnly={showPreview}
        tabIndex={showPreview ? -1 : 0}
        spellCheck={false}
      />
    </div>
  );
}
