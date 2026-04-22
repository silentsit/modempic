import { randomBytes } from "node:crypto";

export function newOrderNumber(): string {
  const part = randomBytes(4).toString("hex").toUpperCase();
  return `MP-${part}`;
}
