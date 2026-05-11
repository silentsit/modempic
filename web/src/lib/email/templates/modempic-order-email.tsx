import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { OrderEmailPayload } from "@/lib/email/types";
import type { EmailAppearance } from "@/lib/email/email-appearance";
import { DEFAULT_EMAIL_APPEARANCE } from "@/lib/email/email-appearance";
import { SITE_TITLE, formatAddressLines, formatMoney, formatOrderDate } from "@/lib/email/templates/format";

export type ModempicOrderEmailProps = OrderEmailPayload & {
  siteUrl: string;
  variant: "customer-order-placed" | "customer-order-paid" | "admin-new-order";
  appearance?: EmailAppearance;
};

function resolveAppearance(a?: EmailAppearance): EmailAppearance {
  return { ...DEFAULT_EMAIL_APPEARANCE, ...a };
}

function headerTitle(props: ModempicOrderEmailProps): string {
  if (props.variant === "admin-new-order") return `New Order: ${props.orderNumber}`;
  if (props.variant === "customer-order-paid") return `Payment received — ${props.orderNumber}`;
  return `Your order: ${props.orderNumber}`;
}

function introText(props: ModempicOrderEmailProps): string {
  if (props.variant === "admin-new-order") {
    return `You have received an order from ${props.customerFullName}. The order is as follows:`;
  }
  if (props.variant === "customer-order-paid") {
    return `Thank you, ${props.customerFullName}. We have recorded payment for your order. Here is a summary:`;
  }
  return `Hi ${props.customerFullName}, thanks for your order. Complete payment using the link from checkout (or open your order below). Here is what we have on file:`;
}

function buildStyles(t: EmailAppearance) {
  return {
    body: {
      backgroundColor: t.pageBackground,
      fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
      margin: 0,
      padding: "24px 12px",
    },
    outer: {
      backgroundColor: t.containerBg,
      borderRadius: t.containerBorderRadius,
      borderWidth: 1,
      borderStyle: "solid" as const,
      borderColor: t.containerBorderColor,
      maxWidth: t.containerMaxWidth,
      margin: "0 auto",
      overflow: "hidden" as const,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    },
    header: {
      backgroundColor: t.headerBackground,
      padding: "18px 24px",
    },
    headerText: {
      color: t.headerTextColor,
      fontSize: 20,
      fontWeight: 700,
      margin: 0,
      lineHeight: "26px",
    },
    contentPad: {
      padding: "24px 24px 32px",
    },
    paragraph: {
      color: "#374151",
      fontSize: 15,
      lineHeight: "22px",
      margin: "0 0 12px",
    },
    orderLinkLine: {
      margin: "0 0 20px",
    },
    link: {
      color: t.accentColor,
      fontSize: 15,
      fontWeight: 600,
      textDecoration: "underline",
    },
    tableWrap: {
      margin: "0 0 16px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
      border: `1px solid ${t.containerBorderColor}`,
      fontSize: 14,
    },
    th: {
      textAlign: "left" as const,
      padding: "10px 12px",
      backgroundColor: "#f9fafb",
      color: "#111827",
      fontWeight: 600,
      borderBottom: `1px solid ${t.containerBorderColor}`,
    },
    td: {
      padding: "10px 12px",
      color: "#374151",
      borderBottom: "1px solid #f3f4f6",
      verticalAlign: "top" as const,
    },
    totalsTable: {
      width: "100%",
      margin: "8px 0 28px",
      fontSize: 14,
      borderCollapse: "collapse" as const,
    },
    totalLabel: {
      padding: "6px 0",
      color: "#4b5563",
      width: "42%",
    },
    totalValue: {
      padding: "6px 0",
      color: "#111827",
      textAlign: "right" as const,
    },
    addrOuter: {
      width: "100%",
      borderCollapse: "collapse" as const,
      margin: "0 0 24px",
    },
    addrCell: {
      width: "50%",
      verticalAlign: "top" as const,
      padding: "0 12px 0 0",
    },
    addrHeading: {
      fontSize: 14,
      fontWeight: 700,
      color: "#111827",
      margin: "0 0 8px",
    },
    addrLine: {
      fontSize: 14,
      color: "#4b5563",
      lineHeight: "20px",
      margin: "0 0 4px",
    },
    footerNote: {
      fontSize: 14,
      lineHeight: "21px",
      color: "#4b5563",
      fontStyle: "italic" as const,
      margin: "0 0 20px",
    },
    smallMuted: {
      fontSize: 12,
      color: "#9ca3af",
      margin: 0,
    },
    promoStrip: {
      backgroundColor: t.promoFooterBackground,
      padding: "20px 24px",
      margin: "8px -24px 0",
    },
    promoText: {
      color: "#ffffff",
      fontSize: 14,
      lineHeight: "21px",
      margin: "0 0 12px",
    },
    socialRow: {
      margin: "0",
    },
    socialLink: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: 600,
      marginRight: 16,
      textDecoration: "underline",
    },
  };
}

export function ModempicOrderEmail(props: ModempicOrderEmailProps) {
  const t = resolveAppearance(props.appearance);
  const styles = buildStyles(t);
  const orderHref = `${props.siteUrl.replace(/\/$/, "")}/order/${encodeURIComponent(props.orderNumber)}/confirmation`;
  const dateStr = formatOrderDate(props.orderDate);
  const shipLines = formatAddressLines(props.shippingAddress);
  const billLines = formatAddressLines(props.billingAddress);
  const loyalty = t.loyaltyMessage.trim();
  const closing = t.closingLine.trim();

  const socials = [
    { href: t.socialFacebook.trim(), label: "Facebook" },
    { href: t.socialInstagram.trim(), label: "Instagram" },
    { href: t.socialPinterest.trim(), label: "Pinterest" },
  ].filter((s) => s.href.length > 0);

  return (
    <Html>
      <Head />
      <Preview>
        {props.variant === "admin-new-order"
          ? `New order ${props.orderNumber} from ${props.customerFullName}`
          : `Order ${props.orderNumber} at ${SITE_TITLE}`}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.outer}>
          <Section style={styles.header}>
            <Text style={styles.headerText}>{headerTitle(props)}</Text>
          </Section>

          <Section style={styles.contentPad}>
            <Text style={styles.paragraph}>{introText(props)}</Text>
            <Text style={styles.orderLinkLine}>
              <Link href={orderHref} style={styles.link}>
                Order #{props.orderNumber} ({dateStr})
              </Link>
            </Text>

            <Section style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: "58%" }}>Product</th>
                    <th style={{ ...styles.th, width: "14%", textAlign: "center" }}>Quantity</th>
                    <th style={{ ...styles.th, width: "28%", textAlign: "right" }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {props.lines.map((line, i) => (
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
                  <td style={styles.totalValue}>{formatMoney(props.subtotalCents)}</td>
                </tr>
                {props.discountCents > 0 ? (
                  <tr>
                    <td style={styles.totalLabel}>Discount</td>
                    <td style={styles.totalValue}>-{formatMoney(props.discountCents)}</td>
                  </tr>
                ) : null}
                {props.taxCents > 0 ? (
                  <tr>
                    <td style={styles.totalLabel}>Tax</td>
                    <td style={styles.totalValue}>{formatMoney(props.taxCents)}</td>
                  </tr>
                ) : null}
                <tr>
                  <td style={styles.totalLabel}>Shipping</td>
                  <td style={styles.totalValue}>
                    {props.shippingMethod}
                    {props.shippingCents === 0 ? " (FREE)" : ` (${formatMoney(props.shippingCents)})`}
                  </td>
                </tr>
                <tr>
                  <td style={styles.totalLabel}>Payment method</td>
                  <td style={styles.totalValue}>{props.paymentMethod}</td>
                </tr>
                <tr>
                  <td style={{ ...styles.totalLabel, fontWeight: 700 }}>Total</td>
                  <td style={{ ...styles.totalValue, fontWeight: 700 }}>{formatMoney(props.totalCents)}</td>
                </tr>
              </tbody>
            </table>

            <table style={styles.addrOuter}>
              <tbody>
                <tr>
                  <td style={styles.addrCell}>
                    <Text style={styles.addrHeading}>Billing address</Text>
                    {billLines.map((line, i) => (
                      <Text key={i} style={styles.addrLine}>
                        {line}
                      </Text>
                    ))}
                  </td>
                  <td style={styles.addrCell}>
                    <Text style={styles.addrHeading}>Shipping address</Text>
                    {shipLines.map((line, i) => (
                      <Text key={i} style={styles.addrLine}>
                        {line}
                      </Text>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>

            {props.variant !== "admin-new-order" && loyalty ? (
              <Text style={styles.footerNote}>{loyalty}</Text>
            ) : null}
            {props.variant !== "admin-new-order" && closing ? (
              <Text style={{ ...styles.paragraph, fontStyle: "normal" as const }}>{closing}</Text>
            ) : null}

            {props.variant !== "admin-new-order" && t.showPromoFooter ? (
              <Section style={styles.promoStrip}>
                {socials.length > 0 ? (
                  <Text style={styles.socialRow}>
                    {socials.map((s) => (
                      <Link key={s.label} href={s.href} style={styles.socialLink}>
                        {s.label}
                      </Link>
                    ))}
                  </Text>
                ) : null}
                <Text style={styles.promoText}>{t.promoFooterText}</Text>
              </Section>
            ) : null}

            <Text style={{ ...styles.smallMuted, marginTop: 16 }}>
              {SITE_TITLE} · <Link href={props.siteUrl}>{props.siteUrl.replace(/^https?:\/\//, "")}</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ModempicOrderEmail;
