export const CARDTOUSDT_PROVIDER = "cardtousdt";

export const CARDTOUSDT_USD_STABLES = ["polygon_usdc", "erc20_usdc", "erc20_usdt", "erc20_pyusd"] as const;

export const CARDTOUSDT_DEFAULT_FULFILL_BAND = 0.8;

export const CARDTOUSDT_TIMESTAMP_WINDOW_SECONDS = 300;

export const CARDTOUSDT_CURRENCIES = ["USD", "EUR", "CAD", "INR", "GBP", "SEK"] as const;

export type CardToUsdtCurrency = (typeof CARDTOUSDT_CURRENCIES)[number];

export type CardToUsdtCreateInput = {
  payoutAddress: string;
  amount: number;
  currency: CardToUsdtCurrency;
  buyerEmail: string;
  orderId: string;
  webhookUrl: string;
};

export type CardToUsdtCreateSuccess = {
  checkoutUrl: string;
  depositAddress: string | null;
  amount: number;
  currency: string;
  amountUsd: number;
  orderId: string;
  webhookSecret: string | null;
  createdAt: string;
  requestId: string | null;
};

export type CardToUsdtCreateFailure = {
  ok: false;
  error: string;
  code: string | null;
  retryable: boolean;
  requestId: string | null;
};

export type CardToUsdtCreateResult =
  | ({ ok: true } & CardToUsdtCreateSuccess)
  | CardToUsdtCreateFailure;

export type CardToUsdtWebhookNotice = {
  orderId: string;
  secret: string;
  txidOut: string;
  valueCoin: string;
  coin: string;
  timestamp: string;
  signature: string;
};

export type CardToUsdtCheckoutMeta = {
  amountUsd: number;
  amount: number;
  currency: string;
  webhookSecret: string | null;
  depositAddress: string | null;
  requestId: string | null;
  checkoutUrl: string;
  createdAt: string;
};
