#!/usr/bin/env node
/**
 * stop — if content MDX was edited without a Humanize pass, auto-continue with follow-up.
 */
import {
  pendingHumanizeFiles,
  readState,
  readStdinJson,
  refreshHumanizeFlags,
  writeHookOutput,
} from "./lib/content-humanize-state.mjs";

const FOLLOWUP_MESSAGE = `Content MDX was edited without a completed Humanize pass. Before finishing this task:

1. Read \`Humanize.txt\` and apply it as a **second pass** (not during first draft).
2. Humanize every edited file under \`web/scripts/content/\` listed in the pending set.
3. If humanizing shortens the piece, add back a cited point, example, or FAQ — no filler.
4. Add \`<!-- modempic:humanized -->\` as the **first line** of each humanized MDX file.
5. Continue with publish, commit, or other remaining steps only after step 4.

Do not mark the task done until the marker is present in each edited MDX file.`;

async function main() {
  const input = await readStdinJson();
  const status = input.status ?? "completed";
  const loopCount = Number(input.loop_count ?? 0);

  if (status !== "completed") {
    writeHookOutput({});
    return;
  }

  const state = readState();
  if (state.skipHumanize) {
    writeHookOutput({});
    return;
  }

  refreshHumanizeFlags();
  const pending = pendingHumanizeFiles();

  if (pending.length === 0) {
    writeHookOutput({});
    return;
  }

  if (loopCount > 0) {
    const fileList = pending.map((file) => `- \`${file}\``).join("\n");
    writeHookOutput({
      followup_message: `${FOLLOWUP_MESSAGE}\n\nStill pending humanize marker:\n${fileList}`,
    });
    return;
  }

  const fileList = pending.map((file) => `- \`${file}\``).join("\n");
  writeHookOutput({
    followup_message: `${FOLLOWUP_MESSAGE}\n\nEdited files:\n${fileList}`,
  });
}

main().catch((error) => {
  console.error("[check-humanize-stop] failed:", error);
  writeHookOutput({});
});
