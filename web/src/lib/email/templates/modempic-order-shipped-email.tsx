import { Body, Button, Container, Head, Html, Link, Preview, Section, Text } from "@react-email/components";
import { MODEMPIC_EMAIL_PURPLE, SITE_TITLE } from "@/lib/email/templates/format";

export type ModempicOrderShippedEmailProps = {
  siteUrl: string;
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  trackingCarrier: string;
  shippingMethod?: string | null;
};

export function ModempicOrderShippedEmail({
  siteUrl,
  orderNumber,
  customerName,
  trackingNumber,
  trackingCarrier,
  shippingMethod,
}: ModempicOrderShippedEmailProps) {
  const origin = siteUrl.replace(/\/$/, "");
  const orderHref = `${origin}/order/${encodeURIComponent(orderNumber)}/confirmation`;
  const carrierLine = trackingCarrier.trim() ? trackingCarrier.trim() : "Carrier";

  return (
    <Html>
      <Head />
      <Preview>
        Tracking for {SITE_TITLE} order {orderNumber}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.outer}>
          <Section style={styles.header}>
            <Text style={styles.headerText}>Your order is on the way</Text>
          </Section>
          <Section style={styles.pad}>
            <Text style={styles.p}>Hi {customerName},</Text>
            <Text style={styles.p}>
              We&apos;ve added tracking for order <strong>{orderNumber}</strong>. Use the details below to follow your shipment.
            </Text>

            <Section style={styles.detailBox}>
              <Text style={{ ...styles.detailLabel, marginTop: 0 }}>Tracking number</Text>
              <Text style={styles.trackingMono}>{trackingNumber}</Text>
              <Text style={styles.detailLabel}>Carrier</Text>
              <Text style={styles.detailValue}>{carrierLine}</Text>
              {shippingMethod?.trim() ? (
                <>
                  <Text style={styles.detailLabel}>Shipping method</Text>
                  <Text style={styles.detailValue}>{shippingMethod.trim()}</Text>
                </>
              ) : null}
            </Section>

            <Section style={{ textAlign: "center" as const, margin: "28px 0 8px" }}>
              <Button href={orderHref} style={styles.button}>
                View your order
              </Button>
            </Section>

            <Text style={styles.muted}>
              If you have questions, reply to this email or contact support through{" "}
              <Link href={origin} style={styles.link}>
                {origin.replace(/^https?:\/\//, "")}
              </Link>
              .
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
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
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
    lineHeight: "26px",
  },
  pad: { padding: "24px 24px 32px" },
  p: { fontSize: 15, lineHeight: "22px", color: "#374151", margin: "0 0 14px" },
  detailBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "solid" as const,
    borderColor: "#e5e7eb",
    padding: "16px 18px",
    margin: "8px 0 0",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    margin: "12px 0 4px",
  },
  detailValue: { fontSize: 15, color: "#111827", margin: 0 },
  trackingMono: {
    fontSize: 16,
    fontWeight: 600,
    color: "#111827",
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    margin: 0,
    letterSpacing: "0.02em",
  },
  button: {
    backgroundColor: MODEMPIC_EMAIL_PURPLE,
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 15,
  },
  link: { color: MODEMPIC_EMAIL_PURPLE },
  muted: { fontSize: 14, color: "#6b7280", lineHeight: "20px", margin: "20px 0 16px" },
  small: { fontSize: 12, color: "#9ca3af", margin: 0 },
};

export default ModempicOrderShippedEmail;
