import type { Prisma } from "@prisma/client";

const PAYMENT_CODE_PREFIX = "MP-";
const GATEWAY_DESCRIPTOR_MAX_LEN = 80;

/** Format assigned at product creation / migration backfill (e.g. MP-0042). */
export function formatPaymentCode(sequence: number): string {
  return `${PAYMENT_CODE_PREFIX}${String(sequence).padStart(4, "0")}`;
}

/** Next opaque code in the MP-0001 sequence. */
export async function allocatePaymentCode(tx: Prisma.TransactionClient): Promise<string> {
  const rows = await tx.product.findMany({
    where: { paymentCode: { startsWith: PAYMENT_CODE_PREFIX } },
    select: { paymentCode: true },
  });

  let max = 0;
  for (const row of rows) {
    const suffix = row.paymentCode.slice(PAYMENT_CODE_PREFIX.length);
    const n = Number.parseInt(suffix, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }

  return formatPaymentCode(max + 1);
}

/**
 * Build the value sent to hosted checkout as `product_name` — comma-separated
 * opaque codes, never customer-facing product titles.
 */
export function gatewayProductDescriptor(codes: Iterable<string | null | undefined>): string | undefined {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const code of codes) {
    const trimmed = code?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    unique.push(trimmed);
  }
  if (unique.length === 0) return undefined;
  return unique.join(",").slice(0, GATEWAY_DESCRIPTOR_MAX_LEN);
}
