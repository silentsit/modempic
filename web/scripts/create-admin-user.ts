/**
 * Create or update an ADMIN user (credentials provider).
 *
 * From web/:
 *   npx tsx scripts/create-admin-user.ts
 *   npx tsx scripts/create-admin-user.ts --email info@modempic.com --name Modempic
 *
 * Password (pick one):
 *   - Interactive: you will be prompted twice (visible typing in most terminals).
 *   - Non-interactive: set ADMIN_PASSWORD (e.g. in CI only; avoid shell history).
 *
 * Requires DATABASE_URL (use dotenv: `npm run admin:create`).
 */

import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

async function readPasswordTwice(): Promise<string> {
  const fromEnv = process.env.ADMIN_PASSWORD?.trim() || process.env.SEED_ADMIN_PASSWORD?.trim();
  if (fromEnv) {
    if (fromEnv.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
    return fromEnv;
  }

  const rl = readline.createInterface({ input, output });
  try {
    const a = await rl.question("New admin password (min 8 chars): ");
    const b = await rl.question("Confirm password: ");
    if (a !== b) throw new Error("Passwords do not match.");
    if (a.length < 8) throw new Error("Password must be at least 8 characters.");
    return a;
  } finally {
    rl.close();
  }
}

async function main() {
  const email = (argValue("--email") ?? "info@modempic.com").toLowerCase().trim();
  const name = argValue("--name") ?? "Modempic";
  if (!email) throw new Error("Email is required.");

  const password = await readPasswordTwice();
  const passwordHash = await bcrypt.hash(password, 12);

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        emailVerified: new Date(),
        passwordHash,
        role: Role.ADMIN,
      },
      update: {
        name,
        emailVerified: new Date(),
        passwordHash,
        role: Role.ADMIN,
        bannedAt: null,
      },
    });
    console.log(`OK — admin user ready: ${user.email} (${user.name ?? "no name"}) id=${user.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
