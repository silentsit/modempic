import { headers } from "next/headers";

export type CheckoutAttribution = {
  originSource: string | null;
  originReferrer: string | null;
  deviceType: string;
  customerIp: string | null;
};

export async function deriveCheckoutAttribution(): Promise<CheckoutAttribution> {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const referrer = h.get("referer") ?? h.get("referrer") ?? "";
  const xff = h.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0]?.trim() || h.get("x-real-ip") || null;

  let originSource: string | null = "Direct";
  let originReferrer: string | null = null;
  if (referrer) {
    try {
      const u = new URL(referrer);
      originReferrer = u.hostname.replace(/^www\./, "");
      const search = u.searchParams.toString().toLowerCase();
      if (/google\.|bing\.|duckduckgo\.|yahoo\.|yandex\./.test(originReferrer)) {
        originSource = "Organic";
      } else if (originReferrer && !originReferrer.endsWith("modempic.com")) {
        originSource = "Referral";
      }
      if (/(^|[?&])(utm_|gclid|fbclid)/.test(search)) originSource = "Paid";
    } catch {
      originReferrer = null;
    }
  }

  let deviceType = "Desktop";
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
    deviceType = /iPad|Tablet/i.test(ua) ? "Tablet" : "Mobile";
  }

  return { originSource, originReferrer, deviceType, customerIp: ip };
}
