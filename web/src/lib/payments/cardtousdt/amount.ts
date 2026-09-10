import { CARDTOUSDT_USD_STABLES } from "./types";
import { cardToUsdtApiBase } from "./config";

export function isCardToUsdtUsdStable(coin: string): boolean {
  return (CARDTOUSDT_USD_STABLES as readonly string[]).includes(coin);
}

/** `polygon_pol` → `polygon/pol`; `eth` stays `eth`. Never keep the underscore in the path. */
export function cardToUsdtCoinInfoPath(coin: string): string {
  return coin.trim().replaceAll("_", "/");
}

export function cardToUsdtCoinInfoUrl(coin: string): string {
  return `${cardToUsdtApiBase()}/crypto/${cardToUsdtCoinInfoPath(coin)}/info.php`;
}

export function cardToUsdtChargeAmount(totalCents: number): number {
  return Number((totalCents / 100).toFixed(2));
}

export function meetsCardToUsdtFulfillBand(paidUsd: number, expectedUsd: number, band: number): boolean {
  if (!Number.isFinite(paidUsd) || !Number.isFinite(expectedUsd) || expectedUsd <= 0) return false;
  if (!Number.isFinite(band) || band <= 0) return false;
  return paidUsd + 1e-9 >= expectedUsd * band;
}

export async function cardToUsdtPaidUsd(
  valueCoin: string,
  coin: string,
  fetchImpl: typeof fetch = fetch,
): Promise<number | null> {
  const raw = Number(valueCoin);
  if (!Number.isFinite(raw)) return null;
  if (isCardToUsdtUsdStable(coin)) return raw;

  try {
    const res = await fetchImpl(cardToUsdtCoinInfoUrl(coin), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const info = (await res.json()) as { prices?: { USD?: unknown } };
    const usd = Number(info?.prices?.USD);
    if (!Number.isFinite(usd)) return null;
    return raw * usd;
  } catch {
    return null;
  }
}
