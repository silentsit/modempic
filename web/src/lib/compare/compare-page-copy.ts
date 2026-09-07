import type { CompareProductRecord } from "@/lib/data/compare";

export function compareHeading(left: Pick<CompareProductRecord, "name">, right: Pick<CompareProductRecord, "name">) {
  return `${left.name} vs ${right.name}`;
}

export function compareDocumentTitle(leftName: string, rightName: string) {
  return `${leftName} vs ${rightName}`;
}

export function compareDescription(leftName: string, rightName: string) {
  return `${leftName} vs ${rightName}: live USD pack prices, cost per 200 mg, manufacturer, and customer reviews on Modempic.`;
}

export function compareIntro(leftName: string, rightName: string) {
  return `${leftName} vs ${rightName} is a catalog comparison of two live Modempic listings. Pack prices, cost per tablet, and cost per 200 mg come from the current product tiers. Manufacturer names appear only when a public listing names them.`;
}
