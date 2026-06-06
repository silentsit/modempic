export function joinBillLine2(company: string, apt: string): string | undefined {
  const c = company.trim();
  const a = apt.trim();
  const parts: string[] = [];
  if (c) parts.push(`Company: ${c}`);
  if (a) parts.push(a);
  return parts.length ? parts.join(" · ") : undefined;
}

export function joinFullName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim();
}
