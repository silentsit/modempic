import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CARD_CHECKOUT_STALL_MS,
  assignCardCheckoutTab,
  closeCardCheckoutTab,
  mintCardCheckoutFromBrowser,
  openCardCheckoutPlaceholder,
} from "./card-checkout-tab";

function stubWindow(openImpl?: (url: string, name: string) => object | null) {
  const open = vi.fn(openImpl ?? ((_url: string, _name: string) => null));
  vi.stubGlobal("window", { open });
  return open;
}

describe("card checkout tab helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("opens a named placeholder tab during the user click", () => {
    const tab = {
      closed: false,
      document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
      location: { replace: vi.fn() },
      focus: vi.fn(),
      opener: {} as Window | null,
    };
    stubWindow(() => tab);

    const opened = openCardCheckoutPlaceholder();
    const html = String(tab.document.write.mock.calls[0]?.[0] ?? "");

    expect(window.open).toHaveBeenCalledWith("about:blank", "modempic-card-checkout");
    expect(opened).toBe(tab);
    expect(tab.opener).toBeTruthy();
    expect(html).toContain("BroadcastChannel");
    expect(html).toContain(String(CARD_CHECKOUT_STALL_MS));
    expect(html).toContain("do not wait on this page");
    expect(html).not.toContain("Do not leave this page");
  });

  it("navigates the placeholder tab when the hosted URL is ready", () => {
    stubWindow();
    const tab = {
      closed: false,
      location: { replace: vi.fn() },
      focus: vi.fn(),
    };
    const opened = assignCardCheckoutTab(tab as unknown as Window, "https://checkout.example/pay");

    expect(opened).toBe(true);
    expect(tab.location.replace).toHaveBeenCalledWith("https://checkout.example/pay");
    expect(tab.focus).toHaveBeenCalled();
  });

  it("closes a leftover placeholder tab", () => {
    stubWindow();
    const tab = { close: vi.fn() };
    closeCardCheckoutTab(tab as unknown as Window);
    expect(tab.close).toHaveBeenCalled();
  });

  it("opens the hosted URL in the named tab without noopener features", () => {
    const tab = { opener: {} as Window | null, closed: false };
    const open = stubWindow(() => tab);

    const opened = assignCardCheckoutTab(null, "https://checkout.example/pay");

    expect(opened).toBe(true);
    expect(open).toHaveBeenCalledWith("https://checkout.example/pay", "modempic-card-checkout");
    expect(open.mock.calls[0][2]).toBeUndefined();
    expect(tab.opener).toBeNull();
  });

  it("rejects a non-https checkout URL", () => {
    stubWindow();
    expect(assignCardCheckoutTab(null, "http://checkout.example/pay")).toBe(false);
    expect(window.open).not.toHaveBeenCalled();
  });

  it("mints card checkout from the browser with a timeout", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, url: "https://checkout.example/pay" }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(mintCardCheckoutFromBrowser("MP-1")).resolves.toEqual({
      url: "https://checkout.example/pay",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/checkout/payment-handoff",
      expect.objectContaining({
        method: "POST",
        signal: expect.any(AbortSignal),
      }),
    );
  });
});
