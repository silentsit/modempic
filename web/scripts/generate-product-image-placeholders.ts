import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

type Manifest = {
  products: {
    slug: string;
    name?: string;
    imagePaths: string[];
  }[];
};

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(SCRIPT_DIR, "..");
const REPO_ROOT = path.resolve(WEB_ROOT, "..");
const MANIFEST_CANDIDATES = [
  path.join(WEB_ROOT, "scripts", "legacy-migration", "noofox-import-manifest.json"),
  path.join(WEB_ROOT, "scripts", "noofox-import-manifest.json"),
];
const PUBLIC_ROOT = path.join(WEB_ROOT, "public");
const NOOFOX_IMAGES_ROOT = path.join(REPO_ROOT, "Noofox-Images");
const LOCAL_PRODUCT_IMAGE_ROOTS = [
  path.join(NOOFOX_IMAGES_ROOT, "product_images_original"),
  path.join(NOOFOX_IMAGES_ROOT, "product_images"),
];
const LOCAL_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function titleFromSlug(slug: string) {
  return slug
    .replace(/^buy-/, "")
    .split("-")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(" ");
}

function normalizeProductKey(value: string) {
  return value.replace(/^buy\s+/i, "").replace(/^buy-/i, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

async function getProductImageFiles(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && LOCAL_IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => {
      const aName = path.basename(a).toLowerCase();
      const bName = path.basename(b).toLowerCase();
      const aFeature = aName.includes("feature") ? 0 : 1;
      const bFeature = bName.includes("feature") ? 0 : 1;
      return aFeature - bFeature || aName.localeCompare(bName, undefined, { numeric: true });
    });
}

async function findLocalProductImages(product: Manifest["products"][number]) {
  const keys = new Set([normalizeProductKey(product.name || ""), normalizeProductKey(product.slug)].filter(Boolean));

  for (const root of LOCAL_PRODUCT_IMAGE_ROOTS) {
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || !keys.has(normalizeProductKey(entry.name))) continue;
      const files = await getProductImageFiles(path.join(root, entry.name));
      if (files.length > 0) return files;
    }
  }

  return [];
}

async function writeLocalImage(sourcePath: string, outputPath: string) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const ext = path.extname(outputPath).toLowerCase();
  const image = sharp(sourcePath);

  if (ext === ".webp") {
    await image.webp({ quality: 88 }).toFile(outputPath);
  } else if (ext === ".png") {
    await image.png().toFile(outputPath);
  } else {
    await image.jpeg({ quality: 90 }).toFile(outputPath);
  }
}

function wrapWords(input: string, maxLineLength = 18) {
  const words = input.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLineLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function svgForProduct(name: string, imageIndex: number) {
  const lines = wrapWords(name);
  const titleSpans = lines
    .map((line, index) => `<tspan x="450" y="${262 + index * 52}">${escapeXml(line)}</tspan>`)
    .join("");

  return `
<svg width="900" height="675" viewBox="0 0 900 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fbf8"/>
      <stop offset="100%" stop-color="#e5eee9"/>
    </linearGradient>
    <linearGradient id="box" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#dfe9e4"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#173d32" flood-opacity="0.14"/>
    </filter>
  </defs>
  <rect width="900" height="675" rx="44" fill="url(#bg)"/>
  <circle cx="148" cy="128" r="66" fill="#2f7d63" opacity="0.11"/>
  <circle cx="760" cy="540" r="118" fill="#2f7d63" opacity="0.09"/>
  <g filter="url(#shadow)">
    <rect x="255" y="132" width="390" height="344" rx="24" fill="url(#box)" stroke="#cbdad2" stroke-width="3"/>
    <rect x="286" y="166" width="328" height="70" rx="16" fill="#2f7d63"/>
    <rect x="306" y="386" width="288" height="36" rx="18" fill="#d7e4dd"/>
    <rect x="336" y="434" width="228" height="18" rx="9" fill="#d7e4dd"/>
  </g>
  <text x="450" y="218" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" fill="#ffffff">Modempic</text>
  <text text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="#1f2f2a">${titleSpans}</text>
  <text x="450" y="572" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="600" fill="#507064">Product image ${imageIndex + 1}</text>
</svg>`;
}

async function writeImageIfMissing(
  publicPath: string,
  productName: string,
  imageIndex: number,
  localSourcePath?: string,
) {
  const normalized = publicPath.replace(/^\/+/, "");
  const outputPath = path.join(PUBLIC_ROOT, normalized);
  const ext = path.extname(outputPath).toLowerCase();

  try {
    await fs.access(outputPath);
    return false;
  } catch {
    // Generate only files that are currently missing.
  }

  if (localSourcePath) {
    await writeLocalImage(localSourcePath, outputPath);
    return "local";
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const image = sharp(Buffer.from(svgForProduct(productName, imageIndex))).resize(900, 675);

  if (ext === ".webp") {
    await image.webp({ quality: 86 }).toFile(outputPath);
  } else if (ext === ".png") {
    await image.png().toFile(outputPath);
  } else {
    await image.jpeg({ quality: 88 }).toFile(outputPath);
  }

  return "placeholder";
}

async function resolveManifestPath(): Promise<string | null> {
  for (const candidate of MANIFEST_CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function main() {
  const manifestPath = await resolveManifestPath();
  if (!manifestPath) {
    console.log("No noofox-import-manifest.json found; skipping product image placeholder generation.");
    return;
  }

  const raw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw) as Manifest;
  let local = 0;
  let placeholders = 0;

  for (const product of manifest.products) {
    const name = product.name || titleFromSlug(product.slug);
    const localImages = await findLocalProductImages(product);
    for (let index = 0; index < product.imagePaths.length; index++) {
      const result = await writeImageIfMissing(product.imagePaths[index], name, index, localImages[index]);
      if (result === "local") local++;
      if (result === "placeholder") placeholders++;
    }
  }

  console.log(`Restored ${local} local product image(s); generated ${placeholders} placeholder(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
