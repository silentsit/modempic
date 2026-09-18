/**
 * Create or leave unchanged the NOOFOX10 returning-customer coupon.
 *
 * From web/:
 *   npm run coupon:noofox10
 *
 * 10% off, $20 minimum, once per customer. No calendar expiry — set endsAt in
 * Admin → Coupons if you want a hard stop after this send.
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

const CODE = "NOOFOX10";

async function main() {
  const row = await prisma.coupon.upsert({
    where: { code: CODE },
    create: {
      code: CODE,
      description: "Past Noofox customer 10% off first Modempic order",
      type: "PERCENT",
      value: 10,
      minOrderCents: 2000,
      usageLimitPerUser: 1,
      active: true,
    },
    update: {},
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      minOrderCents: true,
      usageLimitPerUser: true,
      active: true,
      endsAt: true,
    },
  });

  console.log("Coupon ready:", row);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
