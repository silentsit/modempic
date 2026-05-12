import { Body, Button, Container, Head, Html, Preview, Section, Text } from "react-email";
import type { EmailAppearance } from "@/lib/email/email-appearance";
import { DEFAULT_EMAIL_APPEARANCE } from "@/lib/email/email-appearance";
import { SITE_TITLE } from "@/lib/email/templates/format";

export type ModempicPasswordResetEmailProps = {
  siteUrl: string;
  resetLink: string;
  appearance?: EmailAppearance;
};

function resolveAppearance(a?: EmailAppearance): EmailAppearance {
  return { ...DEFAULT_EMAIL_APPEARANCE, ...a };
}

export function ModempicPasswordResetEmail({ siteUrl, resetLink, appearance }: ModempicPasswordResetEmailProps) {
  const t = resolveAppearance(appearance);
  const origin = siteUrl.replace(/\/$/, "");
  return (
    <Html>
      <Head />
      <Preview>Reset your {SITE_TITLE} password</Preview>
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
            <Text style={{ ...base.headerText, color: t.headerTextColor }}>Reset your password</Text>
          </Section>
          <Section style={base.pad}>
            <Text style={base.p}>We received a request to reset the password for your {SITE_TITLE} account.</Text>
            <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
              <Button href={resetLink} style={{ ...base.button, backgroundColor: t.accentColor }}>
                Set a new password
              </Button>
            </Section>
            <Text style={base.muted}>
              If you did not request this, you can ignore this email. This link expires after a short time.
            </Text>
            <Text style={base.small}>
              {SITE_TITLE} · <span style={{ color: t.accentColor }}>{origin.replace(/^https?:\/\//, "")}</span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const base = {
  body: {
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
    margin: 0,
    padding: "24px 12px",
  },
  outer: {
    borderWidth: 1,
    borderStyle: "solid" as const,
    margin: "0 auto",
  },
  header: {
    padding: "18px 24px",
  },
  headerText: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  pad: { padding: "24px 24px 32px" },
  p: { fontSize: 15, lineHeight: "22px", color: "#374151", margin: "0 0 12px" },
  button: {
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 15,
  },
  muted: { fontSize: 14, color: "#6b7280", lineHeight: "20px", margin: "0 0 16px" },
  small: { fontSize: 12, color: "#9ca3af", margin: 0 },
};

export default ModempicPasswordResetEmail;
