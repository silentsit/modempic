import { describe, expect, it } from "vitest";
import { parseCardToUsdtWebhookNotice } from "./notice";

describe("parseCardToUsdtWebhookNotice", () => {
  it("reads settlement fields from the query string", () => {
    const url = new URL(
      "https://modempic.com/api/webhooks/cardtousdt?order_id=MP-1&secret=abc&txid_out=0x1&value_coin=250&coin=erc20_usdt&c2t_ts=1&c2t_sig=v1=ff",
    );
    const notice = parseCardToUsdtWebhookNotice(url, new Headers());
    expect(notice.orderId).toBe("MP-1");
    expect(notice.txidOut).toBe("0x1");
    expect(notice.valueCoin).toBe("250");
    expect(notice.coin).toBe("erc20_usdt");
    expect(notice.timestamp).toBe("1");
    expect(notice.signature).toBe("v1=ff");
  });

  it("falls back to headers when c2t_sig is missing from the query", () => {
    const url = new URL(
      "https://modempic.com/api/webhooks/cardtousdt?order_id=MP-1&txid_out=0x1&value_coin=250&coin=eth",
    );
    const headers = new Headers({
      "x-c2t-timestamp": "99",
      "x-c2t-signature": "v1=aa",
    });
    const notice = parseCardToUsdtWebhookNotice(url, headers);
    expect(notice.timestamp).toBe("99");
    expect(notice.signature).toBe("v1=aa");
  });

  it("normalizes order_id to the uppercase form we store", () => {
    const url = new URL(
      "https://modempic.com/api/webhooks/cardtousdt?order_id=mp-abc-1&txid_out=0x1&value_coin=250&coin=eth",
    );
    const notice = parseCardToUsdtWebhookNotice(url, new Headers());
    expect(notice.orderId).toBe("MP-ABC-1");
  });
});
