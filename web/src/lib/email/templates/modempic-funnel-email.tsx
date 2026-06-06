import { Body, Button, Container, Head, Html, Preview, Section, Text } from "react-email";
import type { EmailAppearance } from "@/lib/email/email-appearance";
import { DEFAULT_EMAIL_APPEARANCE } from "@/lib/email/email-appearance";
import { SITE_TITLE } from "@/lib/email/templates/format";
import { AdditionalContentBlocks } from "@/lib/email/render-additional-content";

export type ModempicFunnelEmailProps = {
  siteUrl: string;
  headline: string;
  preview: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  appearance?: EmailAppearance;
  footerNote?: string;
};

function resolveAppearance(a?: EmailAppearance): EmailAppearance {
  return { ...DEFAULT_EMAIL_APPEARANCE, ...a };
}

const base = {
  body: { margin: 0, padding: "24px 12px", fontFamily: "Arial, Helvetica, sans-serif" as const },
  outer: { margin: "0 auto", border: "1px solid", overflow: "hidden" as const },
  header: { padding: "28px 24px", textAlign: "center" as const },
  headerText: { margin: 0, fontSize: 22, fontWeight: 700 as const, lineHeight: "1.3" },
  pad: { padding: "28px 24px 32px" },
  p: { margin: "0 0 16px", fontSize: 15, lineHeight: "1.6", color: "#374151" },
  button: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 600 as const,
    textDecoration: "none",
    padding: "12px 24px",
    borderRadius: 4,
    display: "inline-block",
  },
  muted: { margin: "16px 0 0", fontSize: 13, lineHeight: "1.5", color: "#6b7280" },
  small: { margin: "24px 0 0", fontSize: 12, color: "#9ca3af", textAlign: "center" as const },
};

export function ModempicFunnelEmail({
  siteUrl,
  headline,
  preview,
  body,
  ctaLabel,
  ctaHref,
  appearance,
  footerNote,
}: ModempicFunnelEmailProps) {
  const t = resolveAppearance(appearance);
  const origin = siteUrl.replace(/\/$/, "");

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ ...base.body, backgroundColor: t.pageBackground }}>
        <Container
          style={{
            ...base.outer,
            maxWidth: t.containerMaxWidth,
            backgroundColor: t.containerBg,
            borderRadius: t.containerBorderRadius,
            borderColor: t.containerBorderColor,
          }}
        >
          <Section style={{ ...base.header, backgroundColor: t.headerBackground }}>
            <Text style={{ ...base.headerText, color: t.headerTextColor }}>{headline}</Text>
          </Section>
          <Section style={base.pad}>
            <Text style={{ ...base.p, whiteSpace: "pre-line" }}>{body}</Text>
            <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
              <Button href={ctaHref} style={{ ...base.button, backgroundColor: t.accentColor }}>
                {ctaLabel}
              </Button>
            </Section>
            {footerNote ? (
              <AdditionalContentBlocks text={footerNote} accentColor={t.accentColor} paragraphStyle={base.muted} />
            ) : (
              <Text style={base.muted}>
                You received this because of activity on your {SITE_TITLE} account. Manage orders and preferences from
                your account dashboard.
              </Text>
            )}
            <Text style={base.small}>
              {SITE_TITLE} · <span style={{ color: t.accentColor }}>{origin.replace(/^https?:\/\//, "")}</span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
