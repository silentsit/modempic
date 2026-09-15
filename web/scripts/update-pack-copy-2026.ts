/**
 * Align PDP meta + body HTML with the 30/60/90 (and combo) pack change.
 * Prices match apply-pack-pricing-2026.ts / sheet columns I and W.
 *
 * From web/: npx tsx scripts/update-pack-copy-2026.ts
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function bootstrapEnvFromFiles() {
  const root = process.cwd();
  for (const name of [".env.local", ".env"]) {
    const fp = path.join(root, name);
    if (!fs.existsSync(fp)) continue;
    const txt = fs.readFileSync(fp, "utf8").replace(/^\uFEFF/, "");
    for (const rawLine of txt.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

bootstrapEnvFromFiles();
const prisma = new PrismaClient();

const LYRICA_SLUG = "buy-lyrica-pregabalin-nervigesic-300-mg";

type PackPrices = { 30: number; 60: number; 90: number };

const STANDARD_PACKS: Record<string, PackPrices> = {
  "buy-artvigil-150-mg": { 30: 50, 60: 80, 90: 110 },
  "buy-waklert-150-mg": { 30: 59, 60: 99, 90: 129 },
  "buy-modalert-200-mg": { 30: 59, 60: 99, 90: 129 },
  "buy-modvigil-200-mg": { 30: 49, 60: 79, 90: 99 },
  "buy-vilafinil-200-mg": { 30: 50, 60: 80, 90: 110 },
  "buy-modawake-200-mg": { 30: 49, 60: 79, 90: 99 },
  "buy-modaheal-200-mg": { 30: 49, 60: 79, 90: 99 },
  "buy-artvigil-250-mg": { 30: 55, 60: 85, 90: 115 },
  "buy-armodaxl-150-mg": { 30: 50, 60: 80, 90: 110 },
  "buy-modaxl-300-mg": { 30: 55, 60: 85, 90: 115 },
  "buy-armodaxl-250-mg": { 30: 55, 60: 85, 90: 115 },
  "buy-modactive-200-mg": { 30: 49, 60: 79, 90: 99 },
  "buy-modafil-md-200-mg": { 30: 50, 60: 80, 90: 110 },
  "buy-modavinil-200-mg": { 30: 49, 60: 79, 90: 99 },
  "buy-modasmart-400-mg": { 30: 59, 60: 89, 90: 129 },
  [LYRICA_SLUG]: { 30: 105, 60: 195, 90: 255 },
};

const SEO_DESC: Record<string, string> = {
  "buy-armodaxl-150-mg":
    "Buy ArmodaXL 150 mg Online — 150 mg armodafinil at $50, $80, or $110, matching Artvigil 150. Live USD packs and card or crypto checkout. Import rules apply.",
  "buy-armodaxl-250-mg":
    "Buy ArmodaXL 250 mg Online — 250 mg armodafinil at $55, $85, or $115, matching Artvigil 250. Live USD packs and card or crypto checkout. Import rules apply.",
  "buy-artvigil-150-mg":
    "Artvigil 150 mg is HAB 150 mg armodafinil at $50, $80, or $110, the lower 150 mg line here. Live USD checkout with card or crypto. Import rules vary.",
  "buy-artvigil-250-mg":
    "Buy Artvigil 250 mg Online — HAB 250 mg armodafinil at $55, $85, or $115. A labeled high-strength option with live USD prices and easy checkout. Import rules vary.",
  [LYRICA_SLUG]:
    "Lyrica (Pregabalin Nervigesic) 300 mg is listed as Nervigesic capsules in 30, 60, or 90 packs at $105, $195, or $255. Live USD prices, card or crypto checkout. Import rules vary.",
  "buy-modactive-200-mg":
    "Buy Modactive 200 mg Online — a 200 mg modafinil row at $49, $79, or $99. Same price band as Modvigil, live USD packs, and checkout when you are ready.",
  "buy-modafil-md-200-mg":
    "Buy Modafil MD 200 mg Online — 200 mg modafinil at $50, $80, or $110. MD is the trade name, not an ODT claim. Live USD packs and easy checkout. Import rules vary.",
  "buy-modaheal-200-mg":
    "Buy Modaheal 200 mg Online — Healing Pharma 200 mg modafinil at $49, $79, or $99. Low 200 mg pricing with a manufacturer listed and live USD checkout.",
  "buy-modalert-200-mg":
    "Buy Modalert 200 mg Online — Sun Pharma 200 mg packs at $59, $99, or $129. Live USD prices, card or crypto checkout, and room to compare packs. Import rules vary.",
  "buy-modasmart-400-mg":
    "Buy Modasmart 400 mg Online — a 400 mg modafinil tablet at $59, $89, or $129. The usual labeled adult dose is 200 mg, not this monolith. Live USD checkout.",
  "buy-modavinil-200-mg":
    "Buy Modavinil 200 mg Online — 200 mg modafinil at $49, $79, or $99 on this live storefront. Same low 200 mg ladder and card or crypto checkout. Import rules vary.",
  "buy-modawake-200-mg":
    "Buy Modawake 200 mg Online — 200 mg modafinil at $49, $79, or $99. The brand leans wake; the US label is still three sleep indications. Live USD checkout.",
  "buy-modaxl-300-mg":
    "Buy ModaXL 300 mg Online — a 300 mg modafinil catalog tablet at $55, $85, or $115. US-labeled tablets are 100 mg and 200 mg. Live USD checkout. Import rules vary.",
  "buy-modvigil-200-mg":
    "Buy Modvigil 200 mg Online at this catalog’s lowest 200 mg ladder: $49, $79, or $99. Same listed strength as Modalert, sharper pack price, and live USD checkout.",
  "buy-vilafinil-200-mg":
    "Buy Vilafinil 200 mg Online — Centurion 200 mg modafinil at $50, $80, or $110. Named manufacturer, live USD prices, and card or crypto checkout. Import rules vary.",
  "buy-waklert-150-mg":
    "Waklert 150 mg is Sun Pharma 150 mg armodafinil at $59, $99, or $129. Pick a pack, see the live USD price, and check out when you are ready.",
  "starter-pack-combo":
    "Buy Starter Pack Combo Online — 10 or 20 tablets each of Modalert 200, Waklert 150, and Artvigil 150. $59 or $89 to sample both molecules. Not a same-day stack.",
  "upsize-combo":
    "Buy Upsize Combo Online — 30 tablets each of Artvigil 250, ModaXL 300, and ArmodaXL 250 for $109. Three high-mg SKUs in one box, not four, and not a stack.",
};

function money(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

function perTablet(price: number, qty: number): string {
  return (price / qty).toFixed(2);
}

function standardPriceTable(p: PackPrices, unit = "tablets"): string {
  const per = unit === "capsules" ? "Per capsule" : "Per tablet";
  return [
    "<table>",
    `<thead><tr><th>Pack</th><th>Checkout price</th><th>${per}</th></tr></thead>`,
    "<tbody>",
    `<tr><td>30 ${unit}</td><td>$${p[30]}</td><td>$${perTablet(p[30], 30)}</td></tr>`,
    `<tr><td>60 ${unit}</td><td>$${p[60]}</td><td>$${perTablet(p[60], 60)}</td></tr>`,
    `<tr><td>90 ${unit}</td><td>$${p[90]}</td><td>$${perTablet(p[90], 90)}</td></tr>`,
    "</tbody></table>",
  ].join("");
}

function rewriteStandardBody(slug: string, html: string, p: PackPrices): string {
  const unit = slug === LYRICA_SLUG ? "capsules" : "tablets";
  let next = html.replace(/<table[\s\S]*?<\/table>/, standardPriceTable(p, unit));

  const same90 = (p[30] / 30) * 90;
  const save90 = same90 - p[90];
  next = next.replace(
    /The 100-tablet pack is \$[\d.]+ cheaper than buying the same 100 tablets at the 30-pack rate \(\$[\d.]+\)\.?/g,
    `The 90-tablet pack is ${money(save90)} cheaper than buying the same 90 tablets at the 30-pack rate (${money(same90)}).`,
  );

  next = next.replace(
    /\$\d+ for 30 tablets, \$\d+ for 50, and \$\d+ for 100/g,
    `$${p[30]} for 30 tablets, $${p[60]} for 60, and $${p[90]} for 90`,
  );

  next = next.replace(
    /Per-tablet cost falls from \$[\d.]+ to \$[\d.]+/g,
    `Per-tablet cost falls from $${perTablet(p[30], 30)} to $${perTablet(p[90], 90)}`,
  );

  next = next
    .replaceAll("30, 50, or 100", "30, 60, or 90")
    .replaceAll("30, 50, and 100", "30, 60, and 90")
    .replaceAll("30 / 50 / 100", "30 / 60 / 90")
    .replaceAll("100-tablet pack", "90-tablet pack")
    .replaceAll("100-pack", "90-pack")
    .replaceAll("50-pack", "60-pack");

  next = next
    .replaceAll("$50 / $70 / $120", "$50 / $80 / $110")
    .replaceAll("$59 / $89 / $149", "$59 / $99 / $129")
    .replaceAll("$49 / $69 / $109", "$49 / $79 / $99")
    .replaceAll("$55 / $85 / $125", "$55 / $85 / $115")
    .replaceAll("$9 / $9 / $19", "$9 / $19 / $19")
    .replaceAll("$5 / $15 / $5", "$5 / $5 / $5");

  next = next.replaceAll(
    "$59 / $79 / $139",
    slug === "buy-modasmart-400-mg" ? "$59 / $89 / $129" : "$59 / $99 / $129",
  );

  return next;
}

function rewriteStarterBody(html: string): string {
  return html
    .replaceAll("10 or 30 tablets each", "10 or 20 tablets each")
    .replaceAll("10 or 30 tablets", "10 or 20 tablets")
    .replaceAll("a 100-pack of that brand", "a 90-pack of that brand")
    .replaceAll("commit to a 100-pack", "commit to a 90-pack")
    .replaceAll(
      "Choose “10 pills of each” (30 tablets total) or “30 pills of each” (90 tablets total).",
      "Choose “10 pills of each” (30 tablets total) or “20 pills of each” (60 tablets total).",
    )
    .replace(
      /<table[\s\S]*?<\/table>/,
      [
        "<table>",
        "<thead><tr><th>Pack</th><th>Checkout price</th><th>Per tablet</th></tr></thead>",
        "<tbody>",
        "<tr><td>10 tablets of each (30 total)</td><td>$59</td><td>$1.97</td></tr>",
        "<tr><td>20 tablets of each (60 total)</td><td>$89</td><td>$1.48</td></tr>",
        "</tbody></table>",
      ].join(""),
    )
    .replace(
      /Three separate 30-packs of those SKUs would be \$59 \+ \$59 \+ \$50 = \$168\. The 30-of-each combo is \$69 for the same 90 tablets — \$99 less than buying the three 30-packs one at a time\.[^<]*/,
      "Three separate 30-packs of those SKUs would be $59 + $59 + $50 = $168 for 90 tablets ($1.87 each). The 20-of-each combo is $89 for 60 tablets ($1.48 each). The 10-of-each box is $59 for 30 tablets ($1.97 each) and exists to sample all three brands in one checkout.",
    )
    .replace(
      "10 or 30 tablets each of Modalert 200 mg, Waklert 150 mg, and Artvigil 150 mg.",
      "10 or 20 tablets each of Modalert 200 mg, Waklert 150 mg, and Artvigil 150 mg.",
    )
    .replace(
      "$39 for 10 of each, $69 for 30 of each, in USD, on the current catalog.",
      "$59 for 10 of each, $89 for 20 of each, in USD, on the current catalog.",
    )
    .replace(
      "Yes, against three 30-packs ($168). The combo’s 30-of-each price is $69.",
      "The 20-of-each box is $89 for 60 tablets ($1.48 each) versus $168 for three separate 30-packs ($1.87 each). Counts differ; the combo is the sample set.",
    );
}

function rewriteUpsizeBody(html: string): string {
  return html
    .replaceAll("50 tablets each", "30 tablets each")
    .replaceAll("one $99 checkout", "one $109 checkout")
    .replaceAll("three SKUs × 50 tablets (150 tablets total)", "three SKUs × 30 tablets (90 tablets total)")
    .replaceAll("three SKUs × 30 tablets (150 tablets total)", "three SKUs × 30 tablets (90 tablets total)")
    .replaceAll("150 tablets total", "90 tablets total")
    .replaceAll("three high-mg packs at $99", "three high-mg packs at $109")
    .replaceAll("There is one pack: 50 tablets of each.", "There is one pack: 30 tablets of each.")
    .replace(
      /<table[\s\S]*?<\/table>/,
      [
        "<table>",
        "<thead><tr><th>Pack</th><th>Checkout price</th><th>Per tablet</th></tr></thead>",
        "<tbody>",
        "<tr><td>30 tablets of each (90 total)</td><td>$109</td><td>$1.21</td></tr>",
        "</tbody></table>",
      ].join(""),
    )
    .replace(
      "Three separate 50-packs would be $85 + $85 + $85 = $255. The combo is $99 — $156 less than buying those 50-packs one at a time. Per tablet across the box is $0.66.",
      "Three separate 30-packs would be $55 + $55 + $55 = $165. The combo is $109 — $56 less than buying those 30-packs one at a time. Per tablet across the box is $1.21.",
    )
    .replace(
      "50 tablets each of Artvigil 250 mg, ModaXL 300 mg, and ArmodaXL 250 mg — 150 tablets total. Not four products.",
      "30 tablets each of Artvigil 250 mg, ModaXL 300 mg, and ArmodaXL 250 mg — 90 tablets total. Not four products.",
    )
    .replace(
      "30 tablets each of Artvigil 250 mg, ModaXL 300 mg, and ArmodaXL 250 mg — 150 tablets total. Not four products.",
      "30 tablets each of Artvigil 250 mg, ModaXL 300 mg, and ArmodaXL 250 mg — 90 tablets total. Not four products.",
    )
    .replace("$99 for 50 of each, in USD, on the current catalog.", "$109 for 30 of each, in USD, on the current catalog.")
    .replace(
      "Is This Cheaper Than Buying the Three 50-Packs Separately?",
      "Is This Cheaper Than Buying the Three 30-Packs Separately?",
    )
    .replace("Yes. Separate 50-packs add up to $255. The combo is $99.", "Yes. Separate 30-packs add up to $165. The combo is $109.");
}

function rewriteStarterShortDesc(shortDesc: string): string {
  return shortDesc.replace("Get 10 or 30 tablets each", "Get 10 or 20 tablets each");
}

function rewriteUpsizeLongDesc(longDesc: string): string {
  return longDesc
    .replace("each with 50 pills per item", "each with 30 pills per item")
    .replace("4 unique products", "3 unique products");
}

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, slug: true, shortDesc: true, longDesc: true, seoDesc: true, bodyHtml: true },
  });

  let updated = 0;
  const leftovers: string[] = [];

  for (const product of products) {
    const data: {
      seoDesc?: string;
      shortDesc?: string;
      longDesc?: string;
      bodyHtml?: string;
    } = {};

    const seo = SEO_DESC[product.slug];
    if (seo && seo !== product.seoDesc) data.seoDesc = seo;

    let body = product.bodyHtml ?? "";

    if (product.slug === "starter-pack-combo") {
      const nextShort = rewriteStarterShortDesc(product.shortDesc);
      if (nextShort !== product.shortDesc) data.shortDesc = nextShort;
      if (body) body = rewriteStarterBody(body);
    } else if (product.slug === "upsize-combo") {
      const nextLong = rewriteUpsizeLongDesc(product.longDesc);
      if (nextLong !== product.longDesc) data.longDesc = nextLong;
      if (body) body = rewriteUpsizeBody(body);
    } else {
      const prices = STANDARD_PACKS[product.slug];
      if (prices && body) body = rewriteStandardBody(product.slug, body, prices);
    }

    if (body && body !== (product.bodyHtml ?? "")) data.bodyHtml = body;

    if (Object.keys(data).length === 0) continue;

    await prisma.product.update({ where: { id: product.id }, data });
    updated += 1;
    console.log(`updated copy ${product.slug} (${Object.keys(data).join(", ")})`);

    const blob = [data.shortDesc ?? product.shortDesc, data.longDesc ?? product.longDesc, data.seoDesc ?? product.seoDesc, data.bodyHtml ?? product.bodyHtml].join(
      "\n",
    );
    if (
      /\b50 pills\b|\b100 pills\b|50 tablets of each|10 or 30|\$39 for 10|\$69 for 30|\$99 for 50|5010|5515|5929|10505/.test(
        blob,
      )
    ) {
      leftovers.push(product.slug);
    }
  }

  console.log(`updated ${updated} products`);
  if (leftovers.length) {
    console.warn("possible leftover stale copy:", leftovers.join(", "));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
