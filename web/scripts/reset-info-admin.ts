import { execSync } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local" });

const password = process.env.ADMIN_PASSWORD?.trim() || process.env.SEED_ADMIN_PASSWORD?.trim();
if (!password) {
  console.error("Set ADMIN_PASSWORD or SEED_ADMIN_PASSWORD in .env.local");
  process.exit(1);
}

process.env.ADMIN_PASSWORD = password;
execSync('npx tsx scripts/create-admin-user.ts --email info@modempic.com --name "Dale J. Shinju"', {
  stdio: "inherit",
  env: process.env,
});
