import type { Prisma } from "@prisma/client";

const PAYMENT_CODE_PREFIX = "MP-";
const GATEWAY_DESCRIPTOR_MAX_LEN = 80;

/** Format assigned at product creation / migration backfill (e.g. MP-0042). */
export function formatPaymentCode(sequence: number): string {
  return `${PAYMENT_CODE_PREFIX}${String(sequence).padStart(4, "0")}`;
}

function nextNumericSuffix(codes: Iterable<string>): number {
  let max = 0;
  for (const code of codes) {
    const suffix = code.slice(PAYMENT_CODE_PREFIX.length);
    const n = Number.parseInt(suffix, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

/** Next unused opaque code in the MP-0001 sequence. */
export async function allocatePaymentCode(tx: Prisma.TransactionClient): Promise<string> {
  const rows = await tx.product.findMany({
    where: { paymentCode: { startsWith: PAYMENT_CODE_PREFIX } },
    select: { paymentCode: true },
  });
  const taken = new Set(rows.map((row) => row.paymentCode));

  let n = nextNumericSuffix(taken);
  for (let attempt = 0; attempt < 50; attempt++) {
    const code = formatPaymentCode(n);
    if (!taken.has(code)) return code;
    n += 1;
  }

  throw new Error("Could not allocate a unique payment code");
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

  const joined = unique.join(",");
  if (joined.length <= GATEWAY_DESCRIPTOR_MAX_LEN) return joined;

  const clipped = joined.slice(0, GATEWAY_DESCRIPTOR_MAX_LEN);
  const lastComma = clipped.lastIndexOf(",");
  if (lastComma <= 0) return undefined;
  return clipped.slice(0, lastComma);
}
