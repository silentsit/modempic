/**
 * Copy main product image (01-feature.*) from organized Woo folders into matching
 * folders at the Noofox-Images repo root (e.g. "Buy Modalert 200 mg" → Modalert 200mg).
 *
 * Prefers Noofox-Images/product_images_original when that folder exists for a product,
 * otherwise product_images.
 *
 * From repo root:
 *   npx tsx web/scripts/sync-noofox-main-images.ts
 * From web/:
 *   npx tsx scripts/sync-noofox-main-images.ts
 *
 *   --dry-run   Print planned copies only
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(SCRIPT_DIR, "..");
const REPO_ROOT = path.resolve(WEB_ROOT, "..");
const NOOFOX = path.join(REPO_ROOT, "Noofox-Images");

const SKIP_DEST_NAMES = new Set([
  "uploads",
  "product_images",
  "product_images_original",
  "Noofox Logo",
  "Noofox logo matters",
  "Squooshed pics for Nootropics",
]);

function hasFlag(f: string) {
  return process.argv.includes(f);
}

function fold(s: string) {
  return s.replace(/^buy\s+/i, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

async function findMainFile(dir: string): Promise<string | null> {
  let ents: import("node:fs").Dirent[];
  try {
    ents = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  const candidates = ents.filter((e) => e.isFile() && /^01-feature\./i.test(e.name));
  if (candidates.length === 0) return null;
  const preferred = candidates.find((e) => /\.jpe?g$/i.test(e.name)) ?? candidates[0];
  return path.join(dir, preferred.name);
}

type Target = { name: string; fold: string; abs: string };

function pickDest(sourceFold: string, targets: Target[]): Target | null {
  const exact = targets.find((t) => t.fold === sourceFold);
  if (exact) return exact;

  const PREFIX_MIN = 5;
  const asPrefix = targets.filter((t) => sourceFold.startsWith(t.fold) && t.fold.length >= PREFIX_MIN);
  asPrefix.sort((a, b) => b.fold.length - a.fold.length);
  if (asPrefix.length > 0) return asPrefix[0];

  const asPrefixedBy = targets.filter((t) => t.fold.startsWith(sourceFold) && sourceFold.length >= PREFIX_MIN);
  asPrefixedBy.sort((a, b) => a.fold.length - b.fold.length);
  return asPrefixedBy[0] ?? null;
}

async function resolveSourceDir(folderName: string, originalsRoot: string, thumbsRoot: string): Promise<string | null> {
  const o = path.join(originalsRoot, folderName);
  try {
    await fs.access(o);
    return o;
  } catch {
    try {
      const t = path.join(thumbsRoot, folderName);
      await fs.access(t);
      return t;
    } catch {
      return null;
    }
  }
}

async function main() {
  const dry = hasFlag("--dry-run");
  const originalsRoot = path.join(NOOFOX, "product_images_original");
  const thumbsRoot = path.join(NOOFOX, "product_images");

  try {
    await fs.access(NOOFOX);
  } catch {
    console.error("Noofox-Images not found:", NOOFOX);
    process.exit(1);
  }

  const targets: Target[] = [];
  const rootEnts = await fs.readdir(NOOFOX, { withFileTypes: true });
  for (const e of rootEnts) {
    if (!e.isDirectory()) continue;
    if (SKIP_DEST_NAMES.has(e.name)) continue;
    targets.push({ name: e.name, fold: fold(e.name), abs: path.join(NOOFOX, e.name) });
  }

  const sourceFolders = new Set<string>();
  for (const root of [originalsRoot, thumbsRoot]) {
    try {
      const ents = await fs.readdir(root, { withFileTypes: true });
      for (const ent of ents) {
        if (ent.isDirectory()) sourceFolders.add(ent.name);
      }
    } catch {
      /* missing dir */
    }
  }

  type Job = { folderName: string; srcPath: string; dest: Target };
  const jobs: Job[] = [];
  let skipped = 0;

  for (const folderName of sourceFolders) {
    const srcDir = await resolveSourceDir(folderName, originalsRoot, thumbsRoot);
    if (!srcDir) continue;

    const srcPath = await findMainFile(srcDir);
    if (!srcPath) {
      console.warn(`No 01-feature.* in ${path.relative(REPO_ROOT, srcDir)}`);
      skipped++;
      continue;
    }

    const dest = pickDest(fold(folderName), targets);
    if (!dest) {
      console.warn(`No matching root folder for: "${folderName}" (fold=${fold(folderName)})`);
      skipped++;
      continue;
    }

    jobs.push({ folderName, srcPath, dest });
  }

  const jobsPerDest = new Map<string, number>();
  for (const j of jobs) {
    jobsPerDest.set(j.dest.abs, (jobsPerDest.get(j.dest.abs) ?? 0) + 1);
  }

  let copied = 0;
  for (const j of jobs) {
    const multi = (jobsPerDest.get(j.dest.abs) ?? 0) > 1;
    const ext = path.extname(j.srcPath);
    const destFile = multi
      ? path.join(j.dest.abs, `main-${fold(j.folderName)}${ext}`)
      : path.join(j.dest.abs, `main${ext}`);

    if (dry) {
      console.log(`[dry] ${path.relative(REPO_ROOT, j.srcPath)} → ${path.relative(REPO_ROOT, destFile)}`);
    } else {
      await fs.copyFile(j.srcPath, destFile);
      console.log(`→ ${path.relative(REPO_ROOT, destFile)}`);
    }
    copied++;
  }

  console.log(
    dry ? `(dry-run) ${copied} file(s) would copy. Unresolved: ${skipped}.` : `Done. ${copied} main image(s). Unresolved: ${skipped}.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
