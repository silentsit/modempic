import { z } from "zod";
import { CryptoAsset } from "@prisma/client";
import { joinBillLine2, joinFullName } from "./checkout-address";

const addr = z.object({
  fullName: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(2),
  postal: z.string().min(3).max(20),
  phone: z.string().max(30).optional(),
  country: z.string().min(2).max(2).default("US"),
});

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["CRYPTO", "CARD_ONRAMP"]),
  asset: z.nativeEnum(CryptoAsset).optional(),
  couponCode: z.string().max(32).optional(),
  orderNotes: z.string().max(5000).optional(),
  ship: addr,
  bill: addr,
});

export type CheckoutFormValue = z.infer<typeof checkoutSchema>;

export function parseCheckoutForm(
  fd: FormData,
): { ok: true; value: CheckoutFormValue } | { ok: false; error: string } {
  const shipDifferent = fd.get("shipDifferent") === "on";

  const bill = {
    fullName: joinFullName(String(fd.get("billFirstName") ?? ""), String(fd.get("billLastName") ?? "")),
    line1: String(fd.get("billLine1") ?? ""),
    line2: joinBillLine2(String(fd.get("billCompany") ?? ""), String(fd.get("billLine2") ?? "")),
    city: String(fd.get("billCity") ?? ""),
    state: String(fd.get("billState") ?? "").toUpperCase().slice(0, 2),
    postal: String(fd.get("billPostal") ?? ""),
    phone: String(fd.get("billPhone") ?? "").trim() || undefined,
    country: (String(fd.get("billCountry") ?? "US") || "US").toUpperCase().slice(0, 2),
  };

  const ship = shipDifferent
    ? {
        fullName: joinFullName(String(fd.get("shipFirstName") ?? ""), String(fd.get("shipLastName") ?? "")),
        line1: String(fd.get("shipLine1") ?? ""),
        line2: joinBillLine2(String(fd.get("shipCompany") ?? ""), String(fd.get("shipLine2") ?? "")),
        city: String(fd.get("shipCity") ?? ""),
        state: String(fd.get("shipState") ?? "").toUpperCase().slice(0, 2),
        postal: String(fd.get("shipPostal") ?? ""),
        phone: String(fd.get("shipPhone") ?? "").trim() || undefined,
        country: (String(fd.get("shipCountry") ?? "US") || "US").toUpperCase().slice(0, 2),
      }
    : bill;

  const assetStr = String(fd.get("asset") ?? "USDT");
  const asset = (CryptoAsset as Record<string, CryptoAsset>)[assetStr] ?? CryptoAsset.USDT;

  const parsed = checkoutSchema.safeParse({
    paymentMethod: fd.get("paymentMethod") === "CARD_ONRAMP" ? "CARD_ONRAMP" : "CRYPTO",
    asset,
    couponCode: String(fd.get("couponCode") ?? "").trim() || undefined,
    orderNotes: String(fd.get("orderNotes") ?? "").trim() || undefined,
    ship,
    bill,
  });

  if (!parsed.success) return { ok: false, error: "Check addresses and try again." };
  return { ok: true, value: parsed.data };
}
