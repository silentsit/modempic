#!/usr/bin/env npx tsx
/**
 * CLI: notify Bing/Yandex (IndexNow) and/or resubmit sitemap.xml to Google Search Console.
 *
 * Usage:
 *   npm run seo:notify
 *   npm run seo:notify -- --indexnow --gsc
 *   npm run seo:notify -- --indexnow-only
 */
import { notifySearchEngines } from "../src/lib/seo/notify-search-engines";

function hasFlag(name: string) {
  return process.argv.includes(name);
}

async function main() {
  const indexNowOnly = hasFlag("--indexnow-only");
  const gscOnly = hasFlag("--gsc-only");
  const indexNow = indexNowOnly || gscOnly ? indexNowOnly : hasFlag("--indexnow") || !hasFlag("--gsc");
  const googleSearchConsole =
    gscOnly || indexNowOnly ? gscOnly : hasFlag("--gsc") || !hasFlag("--indexnow");

  const result = await notifySearchEngines({
    indexNow,
    googleSearchConsole,
    allowDev: process.env.SEO_NOTIFY_ALLOW_DEV === "1",
  });

  console.log(JSON.stringify(result, null, 2));

  if (result.blockedReason) {
    console.error(result.blockedReason);
    process.exit(2);
  }
  if (!result.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
