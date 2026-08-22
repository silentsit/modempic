import { describe, expect, it } from "vitest";
import { formatPaymentCode, gatewayProductDescriptor } from "./payment-code";

describe("formatPaymentCode", () => {
  it("zero-pads sequence numbers", () => {
    expect(formatPaymentCode(1)).toBe("MP-0001");
    expect(formatPaymentCode(42)).toBe("MP-0042");
    expect(formatPaymentCode(9999)).toBe("MP-9999");
  });
});

describe("gatewayProductDescriptor", () => {
  it("joins unique codes and drops empty values", () => {
    expect(gatewayProductDescriptor(["MP-0001", "MP-0002", "MP-0001"])).toBe("MP-0001,MP-0002");
  });

  it("returns undefined when no codes", () => {
    expect(gatewayProductDescriptor([])).toBeUndefined();
    expect(gatewayProductDescriptor([null, "  "])).toBeUndefined();
  });

  it("truncates to 80 characters on a complete code boundary", () => {
    const codes = Array.from({ length: 20 }, (_, i) => formatPaymentCode(i + 1));
    const result = gatewayProductDescriptor(codes);
    expect(result).toBeDefined();
    expect(result!.length).toBeLessThanOrEqual(80);
    expect(result!.split(",").every((code) => /^MP-\d+$/.test(code))).toBe(true);
  });
});
