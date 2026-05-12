/**
 * Prints non-secret hints about DATABASE_URL and Cloudinary env (for local diagnostics).
 * Usage (from web/): node scripts/print-env-hints.mjs
 */
import fs from "node:fs";

const path = ".env.local";
let raw = "";
try {
  raw = fs.readFileSync(path, "utf8");
} catch {
  console.error("Could not read .env.local (create it from .env.example).");
  process.exit(1);
}

function val(key) {
  const m = raw.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) return null;
  let v = m[1].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  return v;
}

function classifyDb(host) {
  const h = (host || "").toLowerCase();
  if (!h) return "unknown";
  if (h === "localhost" || h === "127.0.0.1") return "local-postgres";
  if (h.includes("neon.tech")) return "neon";
  if (h.includes("supabase.co")) return "supabase";
  if (h.includes("amazonaws.com")) return "aws-rds-or-aurora";
  if (h.includes("render.com")) return "render";
  return "hosted-other";
}

const db = val("DATABASE_URL");
if (!db) console.log("DATABASE_URL: not set in .env.local");
else {
  try {
    const u = new URL(db);
    console.log("DATABASE_URL host:", u.hostname);
    console.log("DATABASE kind (heuristic):", classifyDb(u.hostname));
    const ssl = u.searchParams.get("sslmode");
    if (ssl) console.log("sslmode query:", ssl);
  } catch {
    console.log("DATABASE_URL: present but not a valid URL (check quoting)");
  }
}

const cUrl = val("CLOUDINARY_URL");
const cName = val("CLOUDINARY_CLOUD_NAME");
const cKey = val("CLOUDINARY_API_KEY");
const cSec = val("CLOUDINARY_API_SECRET");
console.log("Cloudinary CLOUDINARY_URL set:", Boolean(cUrl && cUrl.length > 10));
console.log("Cloudinary triple (name+key+secret) set:", Boolean(cName && cKey && cSec));
