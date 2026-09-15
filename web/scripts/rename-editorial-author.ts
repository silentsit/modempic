/**
 * Rename generic Admin bylines to the editorial-team name used on the storefront.
 * From web/: npx tsx scripts/rename-editorial-author.ts
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { EDITORIAL_TEAM_NAME } from "../src/lib/blog/editorial-author";

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

async function main() {
  const [author, artvigil, waklert] = await Promise.all([
    prisma.user.updateMany({
      where: {
        OR: [
          { name: { equals: "Admin", mode: "insensitive" } },
          { name: { equals: "Modempic Admin", mode: "insensitive" } },
        ],
      },
      data: { name: EDITORIAL_TEAM_NAME },
    }),
    prisma.product.updateMany({
      where: { slug: "buy-artvigil-150-mg" },
      data: { seoTitle: "Artvigil 150 mg" },
    }),
    prisma.product.updateMany({
      where: { slug: "buy-waklert-150-mg" },
      data: { seoTitle: "Waklert 150 mg" },
    }),
  ]);
  console.log(
    JSON.stringify({
      renamedUsers: author.count,
      name: EDITORIAL_TEAM_NAME,
      artvigilSeoTitle: artvigil.count,
      waklertSeoTitle: waklert.count,
    }),
  );
}

void main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
