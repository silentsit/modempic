import { cardToUsdtSignatureHeader, cardToUsdtTimestampHeader } from "./signature";

function firstParam(params: URLSearchParams, key: string): string {
  return params.get(key)?.trim() ?? "";
}

export function parseCardToUsdtWebhookNotice(url: URL, headers: Headers) {
  const params = url.searchParams;
  return {
    orderId: firstParam(params, "order_id").toUpperCase(),
    secret: firstParam(params, "secret"),
    txidOut: firstParam(params, "txid_out"),
    valueCoin: firstParam(params, "value_coin"),
    coin: firstParam(params, "coin"),
    timestamp: firstParam(params, "c2t_ts") || cardToUsdtTimestampHeader(headers).trim(),
    signature: firstParam(params, "c2t_sig") || cardToUsdtSignatureHeader(headers).trim(),
  };
}
