import { afterEach, describe, expect, it, vi } from "vitest";
import { assignCardCheckoutTab, closeCardCheckoutTab, openCardCheckoutPlaceholder } from "./card-checkout-tab";

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

    expect(window.open).toHaveBeenCalledWith("about:blank", "modempic-card-checkout");
    expect(opened).toBe(tab);
    expect(tab.document.write).toHaveBeenCalled();
    expect(tab.opener).not.toBeNull();
  });

  it("keeps the opener handle until the hosted URL is assigned", () => {
    const opener = {} as Window;
    const tab = {
      closed: false,
      document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
      location: { replace: vi.fn() },
      focus: vi.fn(),
      opener,
    };
    stubWindow(() => tab);

    openCardCheckoutPlaceholder();
    expect(tab.opener).toBe(opener);

    assignCardCheckoutTab(tab as unknown as Window, "https://checkout.example/pay");
    expect(tab.location.replace).toHaveBeenCalledWith("https://checkout.example/pay");
    expect(tab.opener).toBeNull();
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
});
