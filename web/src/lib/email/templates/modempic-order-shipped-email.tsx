import { Body, Button, Container, Head, Html, Link, Preview, Section, Text } from "react-email";
import type { OrderEmailPayload } from "@/lib/email/types";
import type { EmailAppearance } from "@/lib/email/email-appearance";
import { DEFAULT_EMAIL_APPEARANCE } from "@/lib/email/email-appearance";
import { AdditionalContentBlocks } from "@/lib/email/render-additional-content";
import type { ResolvedEmailCopy } from "@/lib/email/email-content";
import { SITE_TITLE, formatMoney, formatOrderDate } from "@/lib/email/templates/format";

export type ModempicOrderShippedEmailProps = {
  siteUrl: string;
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  trackingCarrier: string;
  shippingMethod?: string | null;
  appearance?: EmailAppearance;
  copy?: ResolvedEmailCopy;
  orderPayload?: OrderEmailPayload | null;
};

function resolveAppearance(a?: EmailAppearance): EmailAppearance {
  return { ...DEFAULT_EMAIL_APPEARANCE, ...a };
}

export function ModempicOrderShippedEmail({
  siteUrl,
  orderNumber,
  customerName,
  trackingNumber,
  trackingCarrier,
  shippingMethod,
  appearance,
  copy,
  orderPayload,
}: ModempicOrderShippedEmailProps) {
  const t = resolveAppearance(appearance);
  const origin = siteUrl.replace(/\/$/, "");
  const orderHref = `${origin}/order/${encodeURIComponent(orderNumber)}/confirmation`;
  const carrierLine = trackingCarrier.trim() ? trackingCarrier.trim() : "Carrier";

  const heading = copy?.heading.trim() || "Your Order is On The Way to You";
  const subtitle = copy?.subtitle.trim() || "Tracking Number";
  const body =
    copy?.body.trim() ||
    `Hey ${customerName},\n\nYour order (${orderNumber}) has been dispatched, and is on the way to you.`;

  return (
    <Html>
      <Head />
      <Preview>
        Tracking for {SITE_TITLE} order {orderNumber}
      </Preview>
      <Body style={{ ...styles.body, backgroundColor: t.pageBackground }}>
        <Container
          style={{
            ...styles.outer,
            maxWidth: t.containerMaxWidth,
            backgroundColor: t.containerBg,
            borderRadius: t.containerBorderRadius,
            borderColor: t.containerBorderColor,
          }}
        >
          <Section style={{ ...styles.header, backgroundColor: t.headerBackground }}>
            <Text style={{ ...styles.headerText, color: t.headerTextColor }}>{heading}</Text>
            {subtitle ? (
              <Text style={{ ...styles.headerSub, color: t.headerTextColor }}>{subtitle}</Text>
            ) : null}
          </Section>
          <Section style={styles.pad}>
            <Text style={{ ...styles.p, whiteSpace: "pre-line" }}>{body}</Text>

            {orderPayload ? (
              <>
                <Text style={styles.orderLinkLine}>
                  <Link href={orderHref} style={{ ...styles.link, color: t.accentColor }}>
                    Order #{orderPayload.orderNumber} ({formatOrderDate(orderPayload.orderDate)})
                  </Link>
                </Text>
                <Section style={styles.tableWrap}>
                  <table style={{ ...styles.table, borderColor: t.containerBorderColor }}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, borderColor: t.containerBorderColor }}>Product</th>
                        <th style={{ ...styles.th, borderColor: t.containerBorderColor, textAlign: "center" }}>
                          Quantity
                        </th>
                        <th style={{ ...styles.th, borderColor: t.containerBorderColor, textAlign: "right" }}>
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderPayload.lines.map((line, i) => (
                        <tr key={i}>
                          <td style={styles.td}>{line.title}</td>
                          <td style={{ ...styles.td, textAlign: "center" }}>{line.quantity}</td>
                          <td style={{ ...styles.td, textAlign: "right" }}>{formatMoney(line.lineTotalCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>
                <table style={styles.totalsTable}>
                  <tbody>
                    <tr>
                      <td style={styles.totalLabel}>Subtotal</td>
                      <td style={styles.totalValue}>{formatMoney(orderPayload.subtotalCents)}</td>
                    </tr>
                    <tr>
                      <td style={styles.totalLabel}>Shipping</td>
                      <td style={styles.totalValue}>
                        {orderPayload.shippingMethod}
                        {orderPayload.shippingCents === 0 ? " (FREE)" : ` (${formatMoney(orderPayload.shippingCents)})`}
                      </td>
                    </tr>
                    <tr>
                      <td style={styles.totalLabel}>Payment method</td>
                      <td style={styles.totalValue}>{orderPayload.paymentMethod}</td>
                    </tr>
                    <tr>
                      <td style={{ ...styles.totalLabel, fontWeight: 700 }}>Total</td>
                      <td style={{ ...styles.totalValue, fontWeight: 700 }}>{formatMoney(orderPayload.totalCents)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            ) : null}

            <Section style={{ ...styles.detailBox, borderColor: t.containerBorderColor }}>
              <Text style={{ ...styles.detailLabel, marginTop: 0 }}>Tracking information</Text>
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

            {copy?.additionalContent ? (
              <AdditionalContentBlocks
                text={copy.additionalContent}
                accentColor={t.accentColor}
                paragraphStyle={styles.p}
              />
            ) : null}

            <Section style={{ textAlign: "center" as const, margin: "28px 0 8px" }}>
              <Button href={orderHref} style={{ ...styles.button, backgroundColor: t.accentColor }}>
                View your order
              </Button>
            </Section>

            <Text style={styles.muted}>
              Questions? Visit{" "}
              <Link href={origin} style={{ ...styles.link, color: t.accentColor }}>
                {origin.replace(/^https?:\/\//, "")}
              </Link>
              .
            </Text>
            <Text style={styles.small}>
              {SITE_TITLE} · <span style={{ color: t.accentColor }}>{origin.replace(/^https?:\/\//, "")}</span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
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
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  header: {
    padding: "20px 24px",
  },
  headerText: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    lineHeight: "28px",
  },
  headerSub: {
    fontSize: 15,
    fontWeight: 600,
    margin: "8px 0 0",
    lineHeight: "20px",
    opacity: 0.95,
  },
  pad: { padding: "24px 24px 32px" },
  p: { fontSize: 15, lineHeight: "22px", color: "#374151", margin: "0 0 14px" },
  orderLinkLine: { margin: "0 0 16px" },
  link: { fontWeight: 600 },
  tableWrap: { margin: "0 0 12px" },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    border: "1px solid",
    fontSize: 14,
  },
  th: {
    textAlign: "left" as const,
    padding: "10px 12px",
    backgroundColor: "#f9fafb",
    fontWeight: 600,
    borderBottom: "1px solid",
  },
  td: {
    padding: "10px 12px",
    color: "#374151",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "top" as const,
  },
  totalsTable: {
    width: "100%",
    margin: "8px 0 20px",
    fontSize: 14,
    borderCollapse: "collapse" as const,
  },
  totalLabel: { padding: "4px 0", color: "#6b7280", textAlign: "left" as const },
  totalValue: { padding: "4px 0", color: "#111827", textAlign: "right" as const },
  detailBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "solid" as const,
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
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 15,
  },
  muted: { fontSize: 14, color: "#6b7280", lineHeight: "20px", margin: "20px 0 16px" },
  small: { fontSize: 12, color: "#9ca3af", margin: 0 },
};

export default ModempicOrderShippedEmail;
