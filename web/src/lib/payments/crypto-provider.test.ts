import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CryptoAsset } from "@prisma/client";

const { mockEnv, mockIsPaymentoConfigured } = vi.hoisted(() => ({
  mockEnv: { CRYPTO_PROVIDER: undefined as "paymento" | undefined },
  mockIsPaymentoConfigured: vi.fn(),
}));

vi.mock("@/lib/env", () => ({ env: mockEnv }));
vi.mock("@/lib/payments/paymento", () => ({
  isPaymentoConfigured: () => mockIsPaymentoConfigured(),
}));

import {
  getAvailableCheckoutCryptoAssets,
  resolveCryptoCheckoutProviderForAsset,
} from "./crypto-provider";

describe("resolveCryptoCheckoutProviderForAsset", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSimulate = process.env.DEV_PAYMENT_SIMULATE;

  beforeEach(() => {
    mockEnv.CRYPTO_PROVIDER = undefined;
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

  it("routes assets to paymento when Paymento is configured", () => {
    mockIsPaymentoConfigured.mockReturnValue(true);
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.BTC)).toBe("paymento");
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.USDT)).toBe("paymento");
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.USDT_TRC20)).toBe("paymento");
  });

  it("forces paymento for BTC when CRYPTO_PROVIDER=paymento", () => {
    mockEnv.CRYPTO_PROVIDER = "paymento";
    mockIsPaymentoConfigured.mockReturnValue(true);
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.BTC)).toBe("paymento");
  });

  it("returns null for all assets when Paymento is not configured", () => {
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.BTC)).toBeNull();
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.USDT)).toBeNull();
  });

  it("uses sim for all assets in development when no gateway is configured", () => {
    process.env.NODE_ENV = "development";
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.USDT)).toBe("sim");
    expect(resolveCryptoCheckoutProviderForAsset(CryptoAsset.BTC)).toBe("sim");
  });
});

describe("getAvailableCheckoutCryptoAssets", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockEnv.CRYPTO_PROVIDER = undefined;
    mockIsPaymentoConfigured.mockReturnValue(false);
    process.env.NODE_ENV = "test";
    delete process.env.DEV_PAYMENT_SIMULATE;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.clearAllMocks();
  });

  it("returns all accepted assets when Paymento is configured", () => {
    mockIsPaymentoConfigured.mockReturnValue(true);
    const available = getAvailableCheckoutCryptoAssets();
    expect(available).toContain(CryptoAsset.BTC);
    expect(available).toContain(CryptoAsset.USDT);
    expect(available).toContain(CryptoAsset.USDT_TRC20);
  });

  it("returns empty list when no gateway is configured in test", () => {
    expect(getAvailableCheckoutCryptoAssets()).toEqual([]);
  });
});
