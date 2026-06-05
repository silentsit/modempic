/**
 * Set passwordHash for users who do not have one (dry-run by default).
 *
 * WARNING: Using one shared password for many accounts means anyone who learns
 * that password can sign in as any affected customer email. Prefer per-user
 * "Send password reset" / invite flows for production.
 *
 * From web/:
 *   npm run passwords:set-missing
 *   npm run passwords:set-missing -- --role CUSTOMER
 *   BULK_PASSWORD='your-secret' npm run passwords:set-missing:apply
 *   BULK_PASSWORD='your-secret' npm run passwords:set-missing:apply -- --include-oauth
 *
 * Requires DATABASE_URL (dotenv via npm scripts).
 */

import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

const OAUTH_PROVIDERS = new Set(["google", "instagram", "linkedin"]);

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

function parseRole(raw: string | undefined): Role | undefined {
  const x = (raw ?? "").toUpperCase();
  if (x === "CUSTOMER" || x === "STAFF" || x === "ADMIN") return x as Role;
  return undefined;
}

async function main() {
  const apply = hasFlag("--apply");
  const includeOAuth = hasFlag("--include-oauth");
  const roleFilter = parseRole(argValue("--role")) ?? Role.CUSTOMER;
  const password = process.env.BULK_PASSWORD?.trim();

  if (apply && !password) {
    console.error("Set BULK_PASSWORD in the environment when using --apply (min 8 characters).");
    process.exit(1);
  }
  if (password && password.length < 8) {
    console.error("BULK_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }
  if (roleFilter === Role.ADMIN || roleFilter === Role.STAFF) {
    console.error("Refusing to bulk-set passwords for ADMIN/STAFF. Use scripts/create-admin-user.ts instead.");
    process.exit(1);
  }

  const candidates = await prisma.user.findMany({
    where: {
      passwordHash: null,
      role: roleFilter,
      email: { not: null },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      accounts: { select: { provider: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const withOAuth = candidates.filter((u) =>
    u.accounts.some((a) => OAUTH_PROVIDERS.has(a.provider.toLowerCase())),
  );
  const toUpdate = includeOAuth
    ? candidates
    : candidates.filter((u) => !u.accounts.some((a) => OAUTH_PROVIDERS.has(a.provider.toLowerCase())));

  console.log(`Mode: ${apply ? "APPLY" : "dry-run"}`);
  console.log(`Role filter: ${roleFilter}`);
  console.log(`Include OAuth-linked users: ${includeOAuth}`);
  console.log(`Candidates without password: ${candidates.length}`);
  console.log(`Skipped (OAuth-linked): ${includeOAuth ? 0 : withOAuth.length}`);
  console.log(`Would update: ${toUpdate.length}`);

  if (toUpdate.length > 0 && toUpdate.length <= 20) {
    for (const u of toUpdate) {
      console.log(`  - ${u.email} (${u.name ?? "no name"})`);
    }
  } else if (toUpdate.length > 20) {
    for (const u of toUpdate.slice(0, 10)) {
      console.log(`  - ${u.email}`);
    }
    console.log(`  ... and ${toUpdate.length - 10} more`);
  }

  if (!apply) {
    console.log("\nNo changes written. Re-run with npm run passwords:set-missing:apply and BULK_PASSWORD set.");
    return;
  }

  const passwordHash = await bcrypt.hash(password!, BCRYPT_ROUNDS);
  const ids = toUpdate.map((u) => u.id);
  const result = await prisma.user.updateMany({
    where: { id: { in: ids } },
    data: { passwordHash },
  });

  console.log(`\nUpdated ${result.count} user(s). They can sign in with email + the password from BULK_PASSWORD.`);
  console.log("Tell customers to change their password after first login (Account → Password) when possible.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
