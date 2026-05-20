"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveEmailSettingsAction } from "@/lib/actions/admin";
import {
  listEmailPreviewOrdersAction,
  renderEmailPreviewAction,
  sendEmailPreviewAction,
  type PreviewKind,
  type PreviewOrderVariant,
} from "@/lib/actions/email-preview";
import type { EmailContentKey, EmailContentSettings, EmailTemplateContent } from "@/lib/email/email-content";
import type { EmailAppearance } from "@/lib/email/email-appearance";

type Props = {
  initialAppearance: EmailAppearance;
  initialContent: EmailContentSettings;
  siteUrl: string;
};

type EmailTypeOption = {
  id: EmailContentKey;
  label: string;
  kind: PreviewKind;
  orderVariant?: PreviewOrderVariant;
  passwordMode?: "reset" | "set";
};

const EMAIL_TYPES: EmailTypeOption[] = [
  { id: "shipped", label: "Customer completed order (tracking)", kind: "shipped" },
  {
    id: "customer-order-placed",
    label: "Customer processing order",
    kind: "order",
    orderVariant: "customer-order-placed",
  },
  {
    id: "customer-order-paid",
    label: "Customer invoice / payment received",
    kind: "order",
    orderVariant: "customer-order-paid",
  },
  { id: "admin-new-order", label: "New order (admin)", kind: "order", orderVariant: "admin-new-order" },
  { id: "password-reset", label: "Password reset", kind: "password", passwordMode: "reset" },
  { id: "password-set", label: "Set password (no password on file)", kind: "password", passwordMode: "set" },
];

type SectionId = "type" | "container" | "header" | "content" | "footer" | "send";

const PLACEHOLDER_HINT =
  "{customer_first_name}, {customer_full_name}, {order_number}, {order_date}, {tracking_number}";

function Section({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  open: SectionId | null;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}) {
  const isOpen = open === id;
  return (
    <div className="border-b border-[#dcdcde] last:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium text-[#1d2327] hover:bg-[#f6f7f7]"
        onClick={() => onToggle(id)}
      >
        {title}
        <span className="text-[#646970]" aria-hidden>
          {isOpen ? "▾" : "▸"}
        </span>
      </button>
      {isOpen ? <div className="space-y-3 px-3 pb-4">{children}</div> : null}
    </div>
  );
}

export function EmailCustomizer({ initialAppearance, initialContent, siteUrl }: Props) {
  const [appearance, setAppearance] = useState<EmailAppearance>(initialAppearance);
  const [content, setContent] = useState<EmailContentSettings>(initialContent);
  const [emailTypeId, setEmailTypeId] = useState<EmailContentKey>("shipped");
  const [previewOrderId, setPreviewOrderId] = useState("");
  const [previewOrders, setPreviewOrders] = useState<{ id: string; orderNumber: string; label: string }[]>([]);
  const [openSection, setOpenSection] = useState<SectionId | null>("type");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewRecipient, setPreviewRecipient] = useState("");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const emailType = useMemo(
    () => EMAIL_TYPES.find((t) => t.id === emailTypeId) ?? EMAIL_TYPES[0],
    [emailTypeId],
  );

  const currentContent = content[emailTypeId];

  const iframeWidth = previewWidth === "desktop" ? "100%" : previewWidth === "tablet" ? "768px" : "390px";

  const patchAppearance = useCallback(<K extends keyof EmailAppearance>(key: K, value: EmailAppearance[K]) => {
    setAppearance((prev) => ({ ...prev, [key]: value }));
    setSaveMsg(null);
  }, []);

  const patchContent = useCallback(
    (key: keyof EmailTemplateContent, value: string) => {
      setContent((prev) => ({
        ...prev,
        [emailTypeId]: { ...prev[emailTypeId], [key]: value },
      }));
      setSaveMsg(null);
    },
    [emailTypeId],
  );

  const refreshPreview = useCallback(() => {
    startTransition(async () => {
      setPreviewError(null);
      const res = await renderEmailPreviewAction({
        kind: emailType.kind,
        appearance,
        content,
        orderVariant: emailType.orderVariant,
        previewOrderId: previewOrderId || undefined,
        passwordPreviewMode: emailType.passwordMode,
      });
      if ("error" in res) {
        setPreviewHtml(null);
        setPreviewSubject(null);
        setPreviewError(res.error);
      } else {
        setPreviewHtml(res.html);
        setPreviewSubject(res.subject);
        setPreviewError(null);
      }
    });
  }, [appearance, content, emailType, previewOrderId]);

  useEffect(() => {
    listEmailPreviewOrdersAction().then(setPreviewOrders).catch(() => setPreviewOrders([]));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => refreshPreview(), 450);
    return () => window.clearTimeout(timer);
  }, [appearance, content, emailTypeId, previewOrderId, emailType.kind, emailType.orderVariant, emailType.passwordMode, refreshPreview]);

  function toggleSection(id: SectionId) {
    setOpenSection((prev) => (prev === id ? null : id));
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#dcdcde] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="flex flex-col lg:flex-row lg:min-h-[720px]">
        {/* Controls — WooCommerce-style sidebar */}
        <aside className="w-full shrink-0 border-b border-[#dcdcde] lg:w-[340px] lg:border-b-0 lg:border-r">
          <div className="border-b border-[#dcdcde] bg-[#f6f7f7] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#646970]">Email customizer</p>
            <p className="mt-0.5 text-xs text-[#646970]">Match your WooCommerce workflow — edit, preview, send test.</p>
          </div>

          <div className="max-h-[640px] overflow-y-auto lg:max-h-[calc(720px-52px)]">
            <Section id="type" title="Email type & text" open={openSection} onToggle={toggleSection}>
              <div className="space-y-1">
                <Label htmlFor="emailType">Email type</Label>
                <select
                  id="emailType"
                  className="w-full rounded border border-[#dcdcde] bg-white px-2 py-1.5 text-sm"
                  value={emailTypeId}
                  onChange={(e) => setEmailTypeId(e.target.value as EmailContentKey)}
                >
                  {EMAIL_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {(emailType.kind === "order" || emailType.kind === "shipped") && previewOrders.length > 0 ? (
                <div className="space-y-1">
                  <Label htmlFor="previewOrder">Preview order</Label>
                  <select
                    id="previewOrder"
                    className="w-full rounded border border-[#dcdcde] bg-white px-2 py-1.5 text-sm"
                    value={previewOrderId}
                    onChange={(e) => setPreviewOrderId(e.target.value)}
                  >
                    <option value="">Sample order (demo data)</option>
                    {previewOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-[#646970]">Use a real order for accurate line items in preview.</p>
                </div>
              ) : null}

              <p className="text-[10px] text-[#646970]">Placeholders: {PLACEHOLDER_HINT}</p>

              <div className="space-y-1">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={currentContent.subject} onChange={(e) => patchContent("subject", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="heading">Heading</Label>
                <Input id="heading" value={currentContent.heading} onChange={(e) => patchContent("heading", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={currentContent.subtitle}
                  onChange={(e) => patchContent("subtitle", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="body">Body</Label>
                <Textarea
                  id="body"
                  rows={5}
                  value={currentContent.body}
                  onChange={(e) => patchContent("body", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="additional">Additional content</Label>
                <Textarea
                  id="additional"
                  rows={6}
                  value={currentContent.additionalContent}
                  onChange={(e) => patchContent("additionalContent", e.target.value)}
                />
                <p className="text-[10px] text-[#646970]">Shown below the main message (promos, tracking tips, etc.).</p>
              </div>
            </Section>

            <Section id="container" title="Container" open={openSection} onToggle={toggleSection}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label>Page background</Label>
                  <Input
                    value={appearance.pageBackground}
                    onChange={(e) => patchAppearance("pageBackground", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Width (px)</Label>
                  <Input
                    type="number"
                    min={480}
                    max={720}
                    value={appearance.containerMaxWidth}
                    onChange={(e) => patchAppearance("containerMaxWidth", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Corner radius</Label>
                  <Input
                    type="number"
                    min={0}
                    max={24}
                    value={appearance.containerBorderRadius}
                    onChange={(e) => patchAppearance("containerBorderRadius", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Container background</Label>
                  <Input value={appearance.containerBg} onChange={(e) => patchAppearance("containerBg", e.target.value)} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Border color</Label>
                  <Input
                    value={appearance.containerBorderColor}
                    onChange={(e) => patchAppearance("containerBorderColor", e.target.value)}
                  />
                </div>
              </div>
            </Section>

            <Section id="header" title="Header" open={openSection} onToggle={toggleSection}>
              <div className="space-y-1">
                <Label>Header background</Label>
                <Input
                  value={appearance.headerBackground}
                  onChange={(e) => patchAppearance("headerBackground", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Header text color</Label>
                <Input
                  value={appearance.headerTextColor}
                  onChange={(e) => patchAppearance("headerTextColor", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Accent / button color</Label>
                <Input value={appearance.accentColor} onChange={(e) => patchAppearance("accentColor", e.target.value)} />
              </div>
            </Section>

            <Section id="content" title="Order email extras" open={openSection} onToggle={toggleSection}>
              <div className="space-y-1">
                <Label>Loyalty message</Label>
                <Textarea
                  rows={3}
                  value={appearance.loyaltyMessage}
                  onChange={(e) => patchAppearance("loyaltyMessage", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Closing line</Label>
                <Input value={appearance.closingLine} onChange={(e) => patchAppearance("closingLine", e.target.value)} />
              </div>
            </Section>

            <Section id="footer" title="Promo footer" open={openSection} onToggle={toggleSection}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={appearance.showPromoFooter}
                  onChange={(e) => patchAppearance("showPromoFooter", e.target.checked)}
                  className="h-4 w-4"
                />
                Show promo footer on order emails
              </label>
              <div className="space-y-1">
                <Label>Footer background</Label>
                <Input
                  value={appearance.promoFooterBackground}
                  onChange={(e) => patchAppearance("promoFooterBackground", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Footer text</Label>
                <Textarea
                  rows={3}
                  value={appearance.promoFooterText}
                  onChange={(e) => patchAppearance("promoFooterText", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Input
                  placeholder="Facebook URL"
                  value={appearance.socialFacebook}
                  onChange={(e) => patchAppearance("socialFacebook", e.target.value)}
                />
                <Input
                  placeholder="Instagram URL"
                  value={appearance.socialInstagram}
                  onChange={(e) => patchAppearance("socialInstagram", e.target.value)}
                />
                <Input
                  placeholder="Pinterest URL"
                  value={appearance.socialPinterest}
                  onChange={(e) => patchAppearance("socialPinterest", e.target.value)}
                />
              </div>
            </Section>

            <Section id="send" title="Send preview email" open={openSection} onToggle={toggleSection}>
              <div className="space-y-1">
                <Label htmlFor="previewRecipient">Preview recipient</Label>
                <Input
                  id="previewRecipient"
                  type="email"
                  placeholder="you@example.com"
                  value={previewRecipient}
                  onChange={(e) => setPreviewRecipient(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-[#646970]">
                Saves settings first, then sends the current template with sample or selected order data.
              </p>
              <Button
                type="button"
                className="w-full"
                disabled={pending || !previewRecipient.trim()}
                onClick={() =>
                  startTransition(async () => {
                    setSendMsg(null);
                    try {
                      await saveEmailSettingsAction({ appearance, content });
                      const res = await sendEmailPreviewAction({
                        to: previewRecipient.trim(),
                        kind: emailType.kind,
                        appearance,
                        content,
                        orderVariant: emailType.orderVariant,
                        previewOrderId: previewOrderId || undefined,
                        passwordPreviewMode: emailType.passwordMode,
                      });
                      setSendMsg(res.ok ? "Preview email sent." : res.error ?? "Send failed.");
                    } catch {
                      setSendMsg("Send failed.");
                    }
                  })
                }
              >
                Send email
              </Button>
              {sendMsg ? <p className="text-xs text-[#646970]">{sendMsg}</p> : null}
            </Section>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[#dcdcde] bg-[#f6f7f7] p-3">
            <Button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setSaveMsg(null);
                  try {
                    await saveEmailSettingsAction({ appearance, content });
                    setSaveMsg("All settings saved.");
                  } catch {
                    setSaveMsg("Save failed.");
                  }
                })
              }
            >
              Save all
            </Button>
            <Button type="button" variant="secondary" disabled={pending} onClick={refreshPreview}>
              Refresh preview
            </Button>
            {saveMsg ? <span className="self-center text-xs text-[#646970]">{saveMsg}</span> : null}
          </div>
        </aside>

        {/* Live preview */}
        <div className="flex min-w-0 flex-1 flex-col bg-[#e5e5e5]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dcdcde] bg-white px-3 py-2">
            <div>
              <p className="text-sm font-medium text-[#1d2327]">Live preview</p>
              {previewSubject ? (
                <p className="text-xs text-[#646970]">
                  Subject: <span className="text-[#1d2327]">{previewSubject}</span>
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-1 rounded border border-[#dcdcde] bg-[#f6f7f7] p-0.5">
              {(["desktop", "tablet", "mobile"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  className={`rounded px-2 py-1 text-xs capitalize ${
                    previewWidth === w ? "bg-white font-medium shadow-sm" : "text-[#646970]"
                  }`}
                  onClick={() => setPreviewWidth(w)}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-1 items-start justify-center overflow-auto p-4">
            {previewError ? (
              <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{previewError}</p>
            ) : previewHtml ? (
              <iframe
                title="Email preview"
                className="h-[min(640px,70vh)] rounded border border-[#c3c4c7] bg-white shadow-md transition-all"
                style={{ width: iframeWidth, maxWidth: "100%" }}
                sandbox="allow-same-origin"
                srcDoc={previewHtml}
              />
            ) : (
              <p className="text-sm text-[#646970]">Loading preview…</p>
            )}
          </div>

          {siteUrl ? (
            <p className="border-t border-[#dcdcde] bg-white px-3 py-2 text-center text-[10px] text-[#646970]">
              Production emails use {siteUrl}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
