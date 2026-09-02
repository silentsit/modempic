#!/usr/bin/env node
/**
 * afterFileEdit — track edits to web/scripts/content/*.mdx for humanize enforcement.
 */
import {
  isContentMdx,
  readStdinJson,
  recordContentEdit,
  writeHookOutput,
} from "./lib/content-humanize-state.mjs";

async function main() {
  const input = await readStdinJson();
  const filePath = input.file_path;

  if (!filePath || !isContentMdx(filePath)) {
    writeHookOutput({});
    return;
  }

  recordContentEdit(filePath);
  writeHookOutput({});
}

main().catch((error) => {
  console.error("[track-content-edit] failed:", error);
  writeHookOutput({});
});
