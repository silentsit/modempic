/**
 * Production BTCPay checkout probe — creates a real pending order + BTCPay invoice.
 * Reads credentials from web/.env.local (SEED_ADMIN_PASSWORD + info@modempic.com).
 *
 * Usage: node scripts/btcpay-production-checkout-probe.mjs
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = "https://modempic.com";

function loadEnvLocal() {
  const path = resolve(__dirname, "../.env.local");
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnvLocal();
const email = process.env.CHECKOUT_TEST_EMAIL ?? "info@modempic.com";
const password =
  process.env.CHECKOUT_TEST_PASSWORD ?? env.SEED_ADMIN_PASSWORD ?? "@ftern00nTea369";

/** Sign in via NextAuth API and return cookies for Playwright. */
async function loginViaApi() {
  const jar = new Map();
  const cookieHeader = () => [...jar.values()].join("; ");
  const store = (res) => {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const eq = pair.indexOf("=");
      if (eq > 0) jar.set(pair.slice(0, eq), pair);
    }
  };

  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { headers: { cookie: cookieHeader() } });
  store(csrfRes);
  const { csrfToken } = await csrfRes.json();

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: cookieHeader() },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${BASE}/checkout`,
      json: "true",
    }),
    redirect: "manual",
  });
  store(loginRes);

  const session = [...jar.entries()].find(([k]) => k.includes("session"));
  if (!session) {
    return { ok: false, location: loginRes.headers.get("location") };
  }

  const cookies = [...jar.values()].map((pair) => {
    const eq = pair.indexOf("=");
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    return {
      name,
      value,
      domain: "modempic.com",
      path: "/",
      secure: true,
      httpOnly: name.includes("session") || name.includes("csrf"),
      sameSite: "Lax",
    };
  });

  return { ok: true, cookies };
}

const report = { ok: false, steps: {} };

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

try {
  const auth = await loginViaApi();
  report.steps.login = { ok: auth.ok, api: true, location: auth.location ?? null };
  if (!auth.ok) {
    throw new Error("API login failed — seed password may not match production admin.");
  }
  await context.addCookies(auth.cookies);
  await page.goto(`${BASE}/checkout`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  report.steps.login.url = page.url();
  if (page.url().includes("/login")) {
    throw new Error("Session cookie did not authorize checkout.");
  }

  await page.goto(`${BASE}/checkout?buy=buy-modalert-200-mg`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForURL((url) => url.pathname === "/checkout", { timeout: 30_000 });
  await page.locator("#billFirstName").waitFor({ state: "visible", timeout: 30_000 });
  if (page.url().includes("/cart")) {
    throw new Error("Checkout redirected to empty cart — buy-now slug may have failed.");
  }
  report.steps.addToCart = { ok: true, method: "buy-now", url: page.url() };

  await page.locator("#billFirstName").fill("BTCPay");
  await page.locator("#billLastName").fill("Probe");
  await page.locator("#billLine1").fill("123 Test Street");
  await page.locator("#billCity").fill("Austin");
  await page.selectOption("#billState", "TX");
  await page.locator("#billPostal").fill("78701");
  await page.locator("#billPhone").fill("5125550100");

  const assetSelect = page.locator("#asset");
  if (await assetSelect.count()) {
    await assetSelect.selectOption({ label: /bitcoin|btc/i }).catch(async () => {
      await assetSelect.selectOption({ index: 0 });
    });
  }

  await page.getByRole("button", { name: /place order & pay with bitcoin|pay with crypto/i }).click();
  await page.waitForURL(/\/order\/[^/]+\/confirmation/, { timeout: 45_000 });

  const bodyText = await page.locator("body").innerText();
  const onConfirmation = /thanks for your order/i.test(bodyText);
  const openBtcBtn = (await page.getByRole("button", { name: /pay now|open bitcoin checkout/i }).count()) > 0;
  const btcpayIframe = (await page.locator('iframe[src*="btcpay"]').count()) > 0;

  const errorBanner = page.locator("text=/BTCPay:|full node not available|payment method unavailable/i");
  const errorText = (await errorBanner.count()) > 0 ? (await errorBanner.first().innerText()).slice(0, 300) : null;

  report.steps.checkout = {
    ok: onConfirmation && (openBtcBtn || btcpayIframe) && !errorText,
    url: page.url(),
    onConfirmation,
    openBtcBtn,
    btcpayIframe,
    errorText,
    snippet: bodyText.slice(0, 800),
  };

  report.ok = Boolean(report.steps.login?.ok && report.steps.addToCart?.ok && report.steps.checkout?.ok);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
} catch (e) {
  report.error = e instanceof Error ? e.message : String(e);
  report.lastUrl = page.url();
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
} finally {
  await browser.close();
}
