/**
 * Export Noofox customers eligible for the successor announcement.
 *
 * Includes users with at least one imported Noofox order (orderNumber NF-*).
 * Suppresses banned accounts, missing emails, and anyone who already placed a
 * live Modempic order (non-NF, not draft/cancelled/failed).
 *
 * From web/:
 *   npm run export:noofox-outreach
 *   npm run export:noofox-outreach -- --warmup 500
 *   npm run export:noofox-outreach -- --out ../noofox-outreach.csv
 *
 * Does not know ESP unsubscribes or hard bounces. Merge-suppress those in the ESP
 * before send. Writes CSV only — never commit the output.
 */

import fs from "node:fs";
import path from "node:path";
import { OrderStatus, PrismaClient } from "@prisma/client";

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
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

bootstrapEnvFromFiles();

const prisma = new PrismaClient();

const NF_PREFIX = "NF-";
const CONVERTED_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PROCESSING,
  OrderStatus.ON_HOLD,
  OrderStatus.COMPLETED,
  OrderStatus.REFUNDED,
];

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function iso(d: Date | null): string {
  return d ? d.toISOString() : "";
}

async function main() {
  const warmupRaw = argValue("--warmup") ?? "500";
  const warmup = Math.max(0, Number.parseInt(warmupRaw, 10) || 0);
  const outArg = argValue("--out");
  const outPath = path.resolve(process.cwd(), outArg ?? "scripts/output/noofox-outreach.csv");

  const nfUsers = await prisma.user.findMany({
    where: {
      orders: { some: { orderNumber: { startsWith: NF_PREFIX } } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      bannedAt: true,
      orders: {
        select: { orderNumber: true, status: true, createdAt: true },
      },
    },
  });

  let suppressedNoEmail = 0;
  let suppressedBanned = 0;
  let suppressedConverted = 0;

  const eligible: {
    email: string;
    name: string;
    noofoxOrderCount: number;
    lastNoofoxOrderAt: Date;
  }[] = [];

  for (const u of nfUsers) {
    const email = u.email?.trim().toLowerCase() ?? "";
    if (!email) {
      suppressedNoEmail += 1;
      continue;
    }
    if (u.bannedAt) {
      suppressedBanned += 1;
      continue;
    }

    const nfOrders = u.orders.filter((o) => o.orderNumber.startsWith(NF_PREFIX));
    const converted = u.orders.some(
      (o) => !o.orderNumber.startsWith(NF_PREFIX) && CONVERTED_STATUSES.includes(o.status),
    );
    if (converted) {
      suppressedConverted += 1;
      continue;
    }
    if (nfOrders.length === 0) continue;

    const last = nfOrders.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
    eligible.push({
      email,
      name: (u.name ?? "").trim(),
      noofoxOrderCount: nfOrders.length,
      lastNoofoxOrderAt: last.createdAt,
    });
  }

  eligible.sort((a, b) => b.lastNoofoxOrderAt.getTime() - a.lastNoofoxOrderAt.getTime());

  const seen = new Set<string>();
  const unique = eligible.filter((row) => {
    if (seen.has(row.email)) return false;
    seen.add(row.email);
    return true;
  });

  const header = ["email", "name", "noofoxOrderCount", "lastNoofoxOrderAt", "wave"];
  const lines = [header.join(",")];
  for (let i = 0; i < unique.length; i += 1) {
    const row = unique[i];
    const wave = warmup > 0 && i < warmup ? "warmup" : "rest";
    lines.push(
      [
        csvCell(row.email),
        csvCell(row.name),
        String(row.noofoxOrderCount),
        csvCell(iso(row.lastNoofoxOrderAt)),
        wave,
      ].join(","),
    );
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");

  const warmupCount = warmup > 0 ? Math.min(warmup, unique.length) : 0;
  console.log("Noofox users with NF- orders:", nfUsers.length);
  console.log("Eligible to email:", unique.length);
  console.log("Warmup (wave=warmup):", warmupCount);
  console.log("Rest (wave=rest):", unique.length - warmupCount);
  console.log("Suppressed — no email:", suppressedNoEmail);
  console.log("Suppressed — banned:", suppressedBanned);
  console.log("Suppressed — already ordered on Modempic:", suppressedConverted);
  console.log("Wrote", outPath);
  console.log("Still suppress ESP unsubscribes and hard bounces in the sending tool before you hit send.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
