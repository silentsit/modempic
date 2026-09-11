/** Digits-only E.164 without `+`. Override with `NEXT_PUBLIC_WHATSAPP_E164`. */
const DEFAULT_WHATSAPP_E164 = "66810514552";

export function whatsappE164(raw = process.env.NEXT_PUBLIC_WHATSAPP_E164): string | null {
  const digits = (raw?.trim() || DEFAULT_WHATSAPP_E164).replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

export function whatsappHref(text?: string, raw?: string): string | null {
  const e164 = whatsappE164(raw);
  if (!e164) return null;
  const url = new URL(`https://wa.me/${e164}`);
  const message = text?.trim();
  if (message) url.searchParams.set("text", message);
  return url.toString();
}
