import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LIB_DIR = dirname(fileURLToPath(import.meta.url));
const HOOKS_DIR = join(LIB_DIR, "..");
export const PROJECT_ROOT = join(HOOKS_DIR, "..", "..");
export const STATE_DIR = join(HOOKS_DIR, "state");
export const STATE_FILE = join(STATE_DIR, "content-humanize.json");
export const HUMANIZE_MARKER = "<!-- modempic:humanized -->";

const CONTENT_PATH = "web/scripts/content/";

export function isContentMdx(filePath) {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  return (
    normalized.includes(CONTENT_PATH) &&
    normalized.endsWith(".mdx") &&
    !normalized.endsWith("/")
  );
}

export function relativeContentPath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const idx = normalized.toLowerCase().indexOf(CONTENT_PATH);
  if (idx === -1) return null;
  return normalized.slice(idx);
}

export function fileHasHumanizeMarker(filePath) {
  try {
    return readFileSync(filePath, "utf8").includes(HUMANIZE_MARKER);
  } catch {
    return false;
  }
}

export function defaultState() {
  return {
    skipHumanize: false,
    editedFiles: {},
  };
}

export function readState() {
  try {
    if (!existsSync(STATE_FILE)) return defaultState();
    const parsed = JSON.parse(readFileSync(STATE_FILE, "utf8"));
    return {
      skipHumanize: Boolean(parsed.skipHumanize),
      editedFiles:
        parsed.editedFiles && typeof parsed.editedFiles === "object"
          ? parsed.editedFiles
          : {},
    };
  } catch {
    return defaultState();
  }
}

export function writeState(state) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

export function recordContentEdit(filePath) {
  const relativePath = relativeContentPath(filePath);
  if (!relativePath) return null;

  const state = readState();
  state.editedFiles[relativePath] = {
    editedAt: new Date().toISOString(),
    humanized: fileHasHumanizeMarker(filePath),
  };
  writeState(state);
  return relativePath;
}

export function pendingHumanizeFiles() {
  const state = readState();
  return Object.entries(state.editedFiles)
    .filter(([, entry]) => !entry.humanized)
    .map(([filePath]) => filePath);
}

export function refreshHumanizeFlags() {
  const state = readState();
  let changed = false;

  for (const [relativePath, entry] of Object.entries(state.editedFiles)) {
    const absolutePath = join(PROJECT_ROOT, relativePath);
    const humanized = fileHasHumanizeMarker(absolutePath);
    if (entry.humanized !== humanized) {
      entry.humanized = humanized;
      changed = true;
    }
  }

  if (changed) writeState(state);
  return state;
}

export async function readStdinJson() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8").trim();
  return text ? JSON.parse(text) : {};
}

export function writeHookOutput(output) {
  process.stdout.write(`${JSON.stringify(output)}\n`);
}
