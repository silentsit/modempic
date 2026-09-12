import { describe, expect, it } from "vitest";
import {
  interpretPaymentoVerifyResponse,
  isPaymentoFullyConfirmedStatus,
  parsePaymentoOrderStatus,
} from "./status";

describe("parsePaymentoOrderStatus", () => {
  it("accepts numeric, string numeric, and named statuses", () => {
    expect(parsePaymentoOrderStatus(7)).toBe(7);
    expect(parsePaymentoOrderStatus("8")).toBe(8);
    expect(parsePaymentoOrderStatus("Paid")).toBe(7);
    expect(parsePaymentoOrderStatus("WaitingToConfirm")).toBe(3);
    expect(parsePaymentoOrderStatus("waiting_to_confirm")).toBe(3);
    expect(parsePaymentoOrderStatus("Approve")).toBe(8);
  });
});

describe("isPaymentoFullyConfirmedStatus", () => {
  it("treats Paid and Approve as complete, not mempool wait", () => {
    expect(isPaymentoFullyConfirmedStatus(3)).toBe(false);
    expect(isPaymentoFullyConfirmedStatus(7)).toBe(true);
    expect(isPaymentoFullyConfirmedStatus(8)).toBe(true);
  });
});

describe("interpretPaymentoVerifyResponse", () => {
  it("treats Paid with success:false as fully confirmed", () => {
    expect(
      interpretPaymentoVerifyResponse(
        {
          success: false,
          message: "",
          body: { orderId: "MP-1", orderStatus: "7" },
        },
        true,
      ),
    ).toEqual({
      fullyConfirmed: true,
      waitingForConfirmation: false,
      invalidToken: false,
      orderId: "MP-1",
      orderStatus: 7,
    });
  });

  it("treats Approve success:true as fully confirmed", () => {
    expect(
      interpretPaymentoVerifyResponse(
        {
          success: true,
          body: { orderId: "MP-1", orderStatus: "8" },
        },
        true,
      ),
    ).toMatchObject({ fullyConfirmed: true, orderStatus: 8, orderId: "MP-1" });
  });

  it("does not confirm WaitingToConfirm", () => {
    expect(
      interpretPaymentoVerifyResponse(
        {
          success: false,
          body: { orderId: "MP-1", orderStatus: "WaitingToConfirm" },
        },
        true,
      ),
    ).toMatchObject({ fullyConfirmed: false, waitingForConfirmation: true, orderStatus: 3 });
  });

  it("flags an invalid token", () => {
    expect(
      interpretPaymentoVerifyResponse(
        {
          success: false,
          message: "Invalid Token",
          body: { orderId: "", orderStatus: "Initialize" },
        },
        true,
      ),
    ).toMatchObject({ fullyConfirmed: false, invalidToken: true, waitingForConfirmation: false });
  });

  it("does not confirm a failed HTTP response", () => {
    expect(interpretPaymentoVerifyResponse({ success: true, body: { orderStatus: 8 } }, false)).toEqual({
      fullyConfirmed: false,
      waitingForConfirmation: false,
      invalidToken: false,
    });
  });
});
