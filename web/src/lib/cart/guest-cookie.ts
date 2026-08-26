export const GUEST_CART_COOKIE = "modempic_guest_cart";
export const GUEST_ORDER_COOKIE = "modempic_guest_orders";

export const GUEST_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

const GUEST_KEY_PATTERN = /^[a-zA-Z0-9_-]{8,80}$/;
const ORDER_NUMBER_PATTERN = /^[A-Z0-9-]{6,40}$/i;

export function guestCartCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE_SEC,
  };
}

export function isGuestCartKey(value: string | undefined | null): value is string {
  return Boolean(value && GUEST_KEY_PATTERN.test(value));
}

export function parseGuestOrderNumbers(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const value of raw.split(",")) {
    const next = value.trim().toUpperCase();
    if (ORDER_NUMBER_PATTERN.test(next)) seen.add(next);
  }
  return [...seen].slice(0, 12);
}

export function appendGuestOrderNumber(raw: string | undefined | null, orderNumber: string): string {
  const next = [orderNumber.toUpperCase(), ...parseGuestOrderNumbers(raw).filter((n) => n !== orderNumber.toUpperCase())];
  return next.slice(0, 12).join(",");
}
