#!/usr/bin/env node
/**
 * beforeSubmitPrompt — honor explicit "draft only" / "do not humanize" requests.
 */
import {
  readState,
  readStdinJson,
  writeHookOutput,
  writeState,
} from "./lib/content-humanize-state.mjs";

const SKIP_PATTERN =
  /\b(draft only|outline only|do not humanize|don't humanize|skip humanize)\b/i;

async function main() {
  const input = await readStdinJson();
  const prompt = input.prompt ?? "";

  if (!SKIP_PATTERN.test(prompt)) {
    writeHookOutput({ continue: true });
    return;
  }

  const state = readState();
  state.skipHumanize = true;
  writeState(state);

  writeHookOutput({ continue: true });
}

main().catch((error) => {
  console.error("[skip-humanize-prompt] failed:", error);
  writeHookOutput({ continue: true });
});
