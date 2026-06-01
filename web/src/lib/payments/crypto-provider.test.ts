import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CryptoAsset } from "@prisma/client";

const { mockEnv, mockIsBtcpayConfigured, mockIsPaymentoConfigured } = vi.hoisted(() => ({
  mockEnv: { CRYPTO_PROVIDER: undefined as "btcpay" | "paymento" | undefined },
  mockIsBtcpayConfigured: vi.fn(),
  mockIsPaymentoConfigured: vi.fn(),
}));

vi.mock("@/lib/env", () => ({ env: mockEnv }));
vi.mock("@/lib/payments/btcpay/client", () => ({
  isBtcpayConfigured: () => mockIsBtcpayConfigured(),
}));
vi.mock("@/lib/payments/paymento", () => ({
  isPaymentoConfigured: () => mockIsPaymentoConfigured(),
}));

import {
  BTCPAY_CHECKOUT_ASSETS,
  getAvailableCheckoutCryptoAssets,
  resolveCryptoCheckoutProviderForAsset,
} from "./crypto-provider";

describe("resolveCryptoCheckoutProviderForAsset", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSimulate = process.env.DEV_PAYMENT_SIMULATE;

  beforeEach(() => {
    mockEnv.CRYPTO_PROVIDER = undefined;
    mockIsBtcpayConfigured.mockReturnValue(false);
    mockIsPaymentoConfigured.mockReturnValue(false);
    process.env.NODE_ENV = "test";
    delete process.env.DEV_PAYMENT_SIMULATE;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalSimulate === undefined) delete process.env.DEV_PAYMENT_SIMULATE;
    else process.env.DEV_PAYMENT_SIMULATE = originalSimulate;
    vi.clearAllMocks();
  });

  it("routes BTC to btcpay when both gateways are configured", () => {
    mockIsBtcpayConfigured.mockReturnValue(true);
    mockIsPaymentoConfigured.mockReturnValue(true);
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.BTC)).toBe("btcpay");
  });

  it("routes USDT to paymento when both gateways are configured", () => {
    mockIsBtcpayConfigured.mockReturnValue(true);
    mockIsPaymentoConfigured.mockReturnValue(true);
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.USDT)).toBe("paymento");
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.USDT_TRC20)).toBe("paymento");
  });

  it("forces paymento for BTC when CRYPTO_PROVIDER=paymento", () => {
    mockEnv.CRYPTO_PROVIDER = "paymento";
    mockIsPaymentoConfigured.mockReturnValue(true);
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.BTC)).toBe("paymento");
  });

  it("forces btcpay for USDT when CRYPTO_PROVIDER=btcpay", () => {
    mockEnv.CRYPTO_PROVIDER = "btcpay";
    mockIsBtcpayConfigured.mockReturnValue(true);
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.USDT)).toBe("btcpay");
  });

  it("returns null for BTC when BTCPay is not configured", () => {
    mockIsPaymentoConfigured.mockReturnValue(true);
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.BTC)).toBeNull();
  });

  it("returns null for USDT when Paymento is not configured", () => {
    mockIsBtcpayConfigured.mockReturnValue(true);
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.USDT)).toBeNull();
  });

  it("uses sim for non-BTC assets in development when no gateway is configured", () => {
    process.env.NODE_ENV = "development";
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.USDT)).toBe("sim");
  });
});

describe("getAvailableCheckoutCryptoAssets", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockEnv.CRYPTO_PROVIDER = undefined;
    mockIsBtcpayConfigured.mockReturnValue(false);
    mockIsPaymentoConfigured.mockReturnValue(false);
    process.env.NODE_ENV = "test";
    delete process.env.DEV_PAYMENT_SIMULATE;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.clearAllMocks();
  });

  it("returns BTC only when only BTCPay is configured", () => {
    mockIsBtcpayConfigured.mockReturnValue(true);
    expect(getAvailableCheckoutCryptoAssets()).toEqual([CryptoAsset.BTC]);
  });

  it("returns non-BTC assets when only Paymento is configured", () => {
    mockIsPaymentoConfigured.mockReturnValue(true);
    const available = getAvailableCheckoutCryptoAssets();
    expect(available).not.toContain(CryptoAsset.BTC);
    expect(available).toContain(CryptoAsset.USDT);
    expect(available).toContain(CryptoAsset.USDT_TRC20);
  });

  it("returns full mix when both gateways are configured", () => {
    mockIsBtcpayConfigured.mockReturnValue(true);
    mockIsPaymentoConfigured.mockReturnValue(true);
    const available = getAvailableCheckoutCryptoAssets();
    expect(available).toContain(CryptoAsset.BTC);
    expect(available).toContain(CryptoAsset.USDT);
    expect(available.length).toBeGreaterThan(2);
  });

  it("lists BTC as the only BTCPay-routed asset", () => {
    expect(BTCPAY_CHECKOUT_ASSETS).toEqual([CryptoAsset.BTC]);
  });
});
