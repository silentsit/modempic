import { z } from "zod";
import { CryptoAsset } from "@prisma/client";
import { joinBillLine2, joinFullName } from "./checkout-address";
import { parseCheckoutRegion } from "./checkout-geo";

const addr = z.object({
  fullName: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(80),
  postal: z.string().min(2).max(20),
  phone: z.string().max(30).optional(),
  country: z.string().length(2),
});

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["CARD_ONRAMP", "CRYPTO"]),
  asset: z.nativeEnum(CryptoAsset).optional(),
  couponCode: z.string().max(32).optional(),
  orderNotes: z.string().max(5000).optional(),
  guestEmail: z.string().email().max(255).optional(),
  ship: addr,
  bill: addr,
});

export type CheckoutFormValue = z.infer<typeof checkoutSchema>;

function readAddress(fd: FormData, prefix: "bill" | "ship") {
  const region = parseCheckoutRegion(
    String(fd.get(`${prefix}Country`) ?? "US") || "US",
    String(fd.get(`${prefix}State`) ?? ""),
  );
  if (!region) return null;

  return {
    fullName: joinFullName(String(fd.get(`${prefix}FirstName`) ?? ""), String(fd.get(`${prefix}LastName`) ?? "")),
    line1: String(fd.get(`${prefix}Line1`) ?? ""),
    line2: joinBillLine2(String(fd.get(`${prefix}Company`) ?? ""), String(fd.get(`${prefix}Line2`) ?? "")),
    city: String(fd.get(`${prefix}City`) ?? ""),
    state: region.state,
    postal: String(fd.get(`${prefix}Postal`) ?? ""),
    phone: String(fd.get(`${prefix}Phone`) ?? "").trim() || undefined,
    country: region.country,
  };
}

export function parseCheckoutForm(
  fd: FormData,
): { ok: true; value: CheckoutFormValue } | { ok: false; error: string } {
  const shipDifferent = fd.get("shipDifferent") === "on";
  const bill = readAddress(fd, "bill");
  if (!bill) return { ok: false, error: "Select a valid country and region." };

  const ship = shipDifferent ? readAddress(fd, "ship") : bill;
  if (!ship) return { ok: false, error: "Select a valid shipping country and region." };

  const assetStr = String(fd.get("asset") ?? "USDT");
  const asset = (CryptoAsset as Record<string, CryptoAsset>)[assetStr] ?? CryptoAsset.USDT;

  const methodRaw = String(fd.get("paymentMethod") ?? "CARD_ONRAMP");
  const paymentMethod = methodRaw === "CRYPTO" ? "CRYPTO" : "CARD_ONRAMP";

  const guestEmail = String(fd.get("guestEmail") ?? "").trim().toLowerCase() || undefined;
  if (guestEmail && !z.string().email().safeParse(guestEmail).success) {
    return { ok: false, error: "Enter a valid email for order updates." };
  }

  const parsed = checkoutSchema.safeParse({
    paymentMethod,
    asset,
    couponCode: String(fd.get("couponCode") ?? "").trim() || undefined,
    orderNotes: String(fd.get("orderNotes") ?? "").trim() || undefined,
    guestEmail,
    ship,
    bill,
  });

  if (!parsed.success) return { ok: false, error: "Check addresses and try again." };
  return { ok: true, value: parsed.data };
}
