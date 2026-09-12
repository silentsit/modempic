/** Paymento callback / verify `orderStatus` values. */
export const PAYMENTO_STATUS = {
  INITIALIZE: 0,
  PENDING: 1,
  PARTIAL_PAID: 2,
  WAITING_TO_CONFIRM: 3,
  TIMEOUT: 4,
  USER_CANCELED: 5,
  PAID: 7,
  APPROVE: 8,
  REJECT: 9,
  REFUNDED: 10,
} as const;

const STATUS_BY_NAME: Record<string, number> = {
  initialize: PAYMENTO_STATUS.INITIALIZE,
  pending: PAYMENTO_STATUS.PENDING,
  partialpaid: PAYMENTO_STATUS.PARTIAL_PAID,
  waitingtoconfirm: PAYMENTO_STATUS.WAITING_TO_CONFIRM,
  timeout: PAYMENTO_STATUS.TIMEOUT,
  usercanceled: PAYMENTO_STATUS.USER_CANCELED,
  paid: PAYMENTO_STATUS.PAID,
  approve: PAYMENTO_STATUS.APPROVE,
  reject: PAYMENTO_STATUS.REJECT,
  refunded: PAYMENTO_STATUS.REFUNDED,
};

export function parsePaymentoOrderStatus(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return STATUS_BY_NAME[trimmed.toLowerCase().replace(/[\s_-]/g, "")];
}

/** Paid (required confirmations reached) or Approve (store verified). */
export function isPaymentoFullyConfirmedStatus(status: number): boolean {
  return status === PAYMENTO_STATUS.PAID || status === PAYMENTO_STATUS.APPROVE;
}

export function isPaymentoInFlightStatus(status: number): boolean {
  return (
    status === PAYMENTO_STATUS.INITIALIZE ||
    status === PAYMENTO_STATUS.PENDING ||
    status === PAYMENTO_STATUS.PARTIAL_PAID ||
    status === PAYMENTO_STATUS.WAITING_TO_CONFIRM
  );
}

export type PaymentoVerifyInterpretation = {
  fullyConfirmed: boolean;
  waitingForConfirmation: boolean;
  invalidToken: boolean;
  orderId?: string;
  orderStatus?: number;
};

/**
 * Paymento `success` is true only after Approve. A Paid order often returns
 * `success: false` with `body.orderStatus` 7 — that is still fully confirmed.
 */
export function interpretPaymentoVerifyResponse(
  data: unknown,
  httpOk: boolean,
): PaymentoVerifyInterpretation {
  if (!httpOk || data == null || typeof data !== "object") {
    return { fullyConfirmed: false, waitingForConfirmation: false, invalidToken: false };
  }

  const record = data as Record<string, unknown>;
  const message =
    typeof record.message === "string" ? record.message : typeof record.error === "string" ? record.error : "";
  const body = record.body && typeof record.body === "object" ? (record.body as Record<string, unknown>) : undefined;
  const orderStatus = parsePaymentoOrderStatus(body?.orderStatus ?? body?.OrderStatus);
  const orderIdRaw = body?.orderId ?? body?.OrderId;
  const orderId = orderIdRaw == null || String(orderIdRaw).trim() === "" ? undefined : String(orderIdRaw);
  const invalidToken = /invalid token/i.test(message);

  if (invalidToken) {
    return { fullyConfirmed: false, waitingForConfirmation: false, invalidToken: true, orderId, orderStatus };
  }

  if (record.success === true || (orderStatus != null && isPaymentoFullyConfirmedStatus(orderStatus))) {
    return { fullyConfirmed: true, waitingForConfirmation: false, invalidToken: false, orderId, orderStatus };
  }

  if (orderStatus != null && isPaymentoInFlightStatus(orderStatus)) {
    return { fullyConfirmed: false, waitingForConfirmation: true, invalidToken: false, orderId, orderStatus };
  }

  return { fullyConfirmed: false, waitingForConfirmation: false, invalidToken: false, orderId, orderStatus };
}
