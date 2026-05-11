import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { MODEMPIC_EMAIL_PURPLE, SITE_TITLE } from "@/lib/email/templates/format";

export type ModempicPasswordResetEmailProps = {
  siteUrl: string;
  resetLink: string;
};

export function ModempicPasswordResetEmail({ siteUrl, resetLink }: ModempicPasswordResetEmailProps) {
  const origin = siteUrl.replace(/\/$/, "");
  return (
    <Html>
      <Head />
      <Preview>Reset your {SITE_TITLE} password</Preview>
      <Body style={styles.body}>
        <Container style={styles.outer}>
          <Section style={styles.header}>
            <Text style={styles.headerText}>Reset your password</Text>
          </Section>
          <Section style={styles.pad}>
            <Text style={styles.p}>We received a request to reset the password for your {SITE_TITLE} account.</Text>
            <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
              <Button href={resetLink} style={styles.button}>
                Set a new password
              </Button>
            </Section>
            <Text style={styles.muted}>
              If you did not request this, you can ignore this email. This link expires after a short time.
            </Text>
            <Text style={styles.small}>
              {SITE_TITLE} · <span style={{ color: MODEMPIC_EMAIL_PURPLE }}>{origin.replace(/^https?:\/\//, "")}</span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f3f4f6",
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
    margin: 0,
    padding: "24px 12px",
  },
  outer: {
    backgroundColor: "#ffffff",
    borderRadius: 3,
    borderWidth: 1,
    borderStyle: "solid" as const,
    borderColor: "#e5e7eb",
    maxWidth: 600,
    margin: "0 auto",
  },
  header: {
    backgroundColor: MODEMPIC_EMAIL_PURPLE,
    padding: "18px 24px",
  },
  headerText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  pad: { padding: "24px 24px 32px" },
  p: { fontSize: 15, lineHeight: "22px", color: "#374151", margin: "0 0 12px" },
  button: {
    backgroundColor: MODEMPIC_EMAIL_PURPLE,
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
