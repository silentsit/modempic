"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveEmailAppearanceAction } from "@/lib/actions/admin";
import { renderEmailPreviewAction, type PreviewKind, type PreviewOrderVariant } from "@/lib/actions/email-preview";
import type { EmailAppearance } from "@/lib/email/email-appearance";

type Props = {
  initialAppearance: EmailAppearance;
  siteUrl: string;
};

export function EmailCustomizer({ initialAppearance, siteUrl }: Props) {
  const [appearance, setAppearance] = useState<EmailAppearance>(initialAppearance);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<PreviewKind>("order");
  const [orderVariant, setOrderVariant] = useState<PreviewOrderVariant>("customer-order-paid");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const siteFootnote = useMemo(
    () => (siteUrl ? `Emails use storefront URL: ${siteUrl}` : null),
    [siteUrl],
  );

  function patch<K extends keyof EmailAppearance>(key: K, value: EmailAppearance[K]) {
    setAppearance((prev) => ({ ...prev, [key]: value }));
    setSaveMsg(null);
  }

  return (
    <div className="space-y-6 rounded-lg border border-[#dcdcde] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      {siteFootnote ? <p className="text-xs text-[#646970]">{siteFootnote}</p> : null}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            setSaveMsg(null);
            try {
              await saveEmailAppearanceAction(appearance);
              setSaveMsg("Saved.");
            } catch {
              setSaveMsg("Save failed.");
            }
          });
        }}
      >
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="text-sm font-medium text-[#1d2327]">Layout &amp; frame</legend>
          <div className="space-y-1">
            <Label htmlFor="pageBackground">Page background</Label>
            <Input
              id="pageBackground"
              type="text"
              value={appearance.pageBackground}
              onChange={(e) => patch("pageBackground", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="containerMaxWidth">Container max width (px)</Label>
            <Input
              id="containerMaxWidth"
              type="number"
              min={480}
              max={720}
              value={appearance.containerMaxWidth}
              onChange={(e) => patch("containerMaxWidth", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="containerBg">Container background</Label>
            <Input
              id="containerBg"
              type="text"
              value={appearance.containerBg}
              onChange={(e) => patch("containerBg", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="containerBorderRadius">Corner radius</Label>
            <Input
              id="containerBorderRadius"
              type="number"
              min={0}
              max={24}
              value={appearance.containerBorderRadius}
              onChange={(e) => patch("containerBorderRadius", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="containerBorderColor">Container border color</Label>
            <Input
              id="containerBorderColor"
              type="text"
              value={appearance.containerBorderColor}
              onChange={(e) => patch("containerBorderColor", e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="text-sm font-medium text-[#1d2327]">Header &amp; accent</legend>
          <div className="space-y-1">
            <Label htmlFor="headerBackground">Header background</Label>
            <Input
              id="headerBackground"
              type="text"
              value={appearance.headerBackground}
              onChange={(e) => patch("headerBackground", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="headerTextColor">Header text color</Label>
            <Input
              id="headerTextColor"
              type="text"
              value={appearance.headerTextColor}
              onChange={(e) => patch("headerTextColor", e.target.value)}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="accentColor">Accent color</Label>
            <Input
              id="accentColor"
              type="text"
              value={appearance.accentColor}
              onChange={(e) => patch("accentColor", e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-[#1d2327]">Copy</legend>
          <div className="space-y-1">
            <Label htmlFor="loyaltyMessage">Loyalty message</Label>
            <Textarea
              id="loyaltyMessage"
              rows={4}
              value={appearance.loyaltyMessage}
              onChange={(e) => patch("loyaltyMessage", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="closingLine">Closing line</Label>
            <Input id="closingLine" value={appearance.closingLine} onChange={(e) => patch("closingLine", e.target.value)} />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-[#1d2327]">Promo footer</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={appearance.showPromoFooter}
              onChange={(e) => patch("showPromoFooter", e.target.checked)}
              className="h-4 w-4"
            />
            Show promo footer
          </label>
          <div className="space-y-1">
            <Label htmlFor="promoFooterBackground">Promo footer background</Label>
            <Input
              id="promoFooterBackground"
              type="text"
              value={appearance.promoFooterBackground}
              onChange={(e) => patch("promoFooterBackground", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="promoFooterText">Promo footer text</Label>
            <Textarea
              id="promoFooterText"
              rows={4}
              value={appearance.promoFooterText}
              onChange={(e) => patch("promoFooterText", e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="text-sm font-medium text-[#1d2327]">Social links (optional)</legend>
          <div className="space-y-1">
            <Label htmlFor="socialFacebook">Facebook URL</Label>
            <Input
              id="socialFacebook"
              value={appearance.socialFacebook}
              onChange={(e) => patch("socialFacebook", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="socialInstagram">Instagram URL</Label>
            <Input
              id="socialInstagram"
              value={appearance.socialInstagram}
              onChange={(e) => patch("socialInstagram", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="socialPinterest">Pinterest URL</Label>
            <Input
              id="socialPinterest"
              value={appearance.socialPinterest}
              onChange={(e) => patch("socialPinterest", e.target.value)}
            />
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={pending}>
            Save appearance
          </Button>
          {saveMsg ? <span className="text-xs text-[#646970]">{saveMsg}</span> : null}
        </div>
      </form>

      <div className="border-t border-[#ececec] pt-4">
        <h3 className="text-sm font-medium text-[#1d2327]">Preview</h3>
        <p className="mt-1 text-xs text-[#646970]">
          Uses current form values above (saved or not yet saved). Sends still use the database after you Save.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="space-y-1">
            <Label htmlFor="previewKind">Template</Label>
            <select
              id="previewKind"
              className="rounded border border-[#dcdcde] bg-white px-2 py-1.5 text-sm"
              value={previewKind}
              onChange={(e) => setPreviewKind(e.target.value as PreviewKind)}
            >
              <option value="order">Order email</option>
              <option value="password">Password reset</option>
              <option value="shipped">Shipped</option>
            </select>
          </div>
          {previewKind === "order" ? (
            <div className="space-y-1">
              <Label htmlFor="orderVariant">Order variant</Label>
              <select
                id="orderVariant"
                className="rounded border border-[#dcdcde] bg-white px-2 py-1.5 text-sm"
                value={orderVariant}
                onChange={(e) => setOrderVariant(e.target.value as PreviewOrderVariant)}
              >
                <option value="admin-new-order">Admin · new order</option>
                <option value="customer-order-placed">Customer · placed</option>
                <option value="customer-order-paid">Customer · paid</option>
              </select>
            </div>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="self-end"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setPreviewError(null);
                const res = await renderEmailPreviewAction({
                  kind: previewKind,
                  appearance,
                  ...(previewKind === "order" ? { orderVariant } : {}),
                });
                if ("error" in res) {
                  setPreviewHtml(null);
                  setPreviewError(res.error);
                } else {
                  setPreviewHtml(res.html);
                  setPreviewError(null);
                }
              })
            }
          >
            Refresh preview
          </Button>
        </div>
        {previewError ? <p className="mt-2 text-xs text-red-600">{previewError}</p> : null}
        {previewHtml ? (
          <iframe
            title="Email preview"
            className="mt-3 h-[420px] w-full rounded border border-[#dcdcde] bg-[#fafafa]"
            sandbox="allow-same-origin allow-popups-to-escape-sandbox"
            srcDoc={previewHtml}
          />
        ) : (
          !previewError && (
            <p className="mt-2 text-xs text-[#646970]">Tap “Refresh preview” to render a sample.</p>
          )
        )}
      </div>
    </div>
  );
}
