export const MODEMPIC_EMAIL_BRAND = "#1b4131";
export const SITE_TITLE = "Modempic";

export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export function formatOrderDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

export function formatAddressLines(a: {
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal: string;
  country?: string | null;
  phone?: string | null;
}): string[] {
  const lines = [
    a.fullName,
    a.line1,
    a.line2?.trim() || null,
    `${a.city}, ${a.state} ${a.postal}`,
    a.country && a.country !== "US" ? a.country : null,
    a.phone?.trim() || null,
  ].filter(Boolean) as string[];
  return lines;
}
