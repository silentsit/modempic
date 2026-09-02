#!/usr/bin/env node
/**
 * sessionStart — reset humanize tracking for a new composer session.
 */
import { defaultState, writeHookOutput, writeState } from "./lib/content-humanize-state.mjs";

writeState(defaultState());
writeHookOutput({});
