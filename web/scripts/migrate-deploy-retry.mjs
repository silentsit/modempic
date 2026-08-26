/**
 * Run `prisma migrate deploy` with a longer advisory-lock timeout and retries.
 * Neon + concurrent Vercel builds can exceed Prisma's default 10s lock wait.
 */
import { execSync } from "node:child_process";

const ATTEMPTS = 3;
const RETRY_DELAY_MS = 15_000;
const LOCK_TIMEOUT_MS = process.env.PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT ?? "60000";

function runMigrate() {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT: LOCK_TIMEOUT_MS,
    },
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  try {
    runMigrate();
    process.exit(0);
  } catch (error) {
    if (attempt >= ATTEMPTS) throw error;
    console.warn(
      `[migrate] attempt ${attempt}/${ATTEMPTS} failed; retrying in ${RETRY_DELAY_MS / 1000}s…`,
    );
    await sleep(RETRY_DELAY_MS);
  }
}
