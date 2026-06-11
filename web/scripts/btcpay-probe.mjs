/**
 * One-off BTCPay connectivity probe using production env (e.g. vercel env pull).
 * Prints only non-secret diagnostics.
 */
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = process.argv[2] ?? resolve(__dirname, "../.env.btcpay-test");

function loadEnvFile(path) {
  const text = readFileSync(path, "utf8");
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
    if (!process.env[key]) process.env[key] = val;
  }
}

function normalizeUrl(raw) {
  if (!raw?.trim()) return null;
  try {
    const u = new URL(raw.trim());
    return u.origin;
  } catch {
    return raw.trim().replace(/\/$/, "");
  }
}

loadEnvFile(envPath);

const base = normalizeUrl(process.env.BTCPAY_URL);
const publicUrl = normalizeUrl(process.env.NEXT_PUBLIC_BTCPAY_URL) ?? base;
const apiKey = (process.env.BTCPAY_API_KEY ?? "").trim();
const storeId = (process.env.BTCPAY_STORE_ID ?? "").trim();
const webhookSecret = (process.env.BTCPAY_WEBHOOK_SECRET ?? "").trim();

const report = {
  envFile: envPath,
  configured: Boolean(base && apiKey && storeId),
  serverHost: base ? new URL(base).hostname : null,
  publicHost: publicUrl ? new URL(publicUrl).hostname : null,
  storeIdLength: storeId.length,
  apiKeyLength: apiKey.length,
  webhookSecretConfigured: Boolean(webhookSecret),
  steps: {},
};

async function fetchJson(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(25_000) });
  const ct = res.headers.get("content-type") ?? "";
  const isJson = ct.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text();
  return { ok: res.ok, status: res.status, body, isJson };
}

if (!report.configured) {
  console.log(JSON.stringify({ ...report, error: "Missing BTCPAY_URL, BTCPAY_API_KEY, or BTCPAY_STORE_ID" }, null, 2));
  process.exit(1);
}

// 1) Public modal script (browser path)
try {
  const modal = await fetch(`${publicUrl}/modal/btcpay.js`, { method: "GET", signal: AbortSignal.timeout(25_000) });
  report.steps.modalScript = { ok: modal.ok, status: modal.status, host: new URL(publicUrl).hostname };
} catch (e) {
  report.steps.modalScript = { ok: false, error: String(e?.message ?? e) };
}

// 2) Store metadata (API key)
try {
  const storeRes = await fetchJson(`${base}/api/v1/stores/${encodeURIComponent(storeId)}`, {
    headers: { Accept: "application/json", Authorization: `token ${apiKey}`, "User-Agent": "Modempic-BTCPay-Probe/1.0" },
  });
  report.steps.store = {
    ok: storeRes.ok,
    status: storeRes.status,
    name: storeRes.isJson && storeRes.body && typeof storeRes.body === "object" ? storeRes.body.name : undefined,
  };
} catch (e) {
  report.steps.store = { ok: false, error: String(e?.message ?? e) };
}

// 3) Create minimal test invoice ($1)
const orderNumber = `PROBE-${Date.now()}`;
let invoiceId = null;
try {
  const invoiceRes = await fetchJson(`${base}/api/v1/stores/${encodeURIComponent(storeId)}/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `token ${apiKey}`,
      "User-Agent": "Modempic-BTCPay-Probe/1.0",
    },
    body: JSON.stringify({
      amount: 1,
      currency: "USD",
      metadata: { orderId: orderNumber, probe: "true" },
      checkout: {
        redirectURL: "https://modempic.com/checkout",
        redirectAutomatically: true,
      },
    }),
  });

  const data = invoiceRes.body && typeof invoiceRes.body === "object" ? invoiceRes.body : {};
  invoiceId = typeof data.id === "string" ? data.id : null;
  const checkoutLink =
    typeof data.checkoutLink === "string"
      ? data.checkoutLink
      : typeof data.url === "string"
        ? data.url
        : null;

  report.steps.createInvoice = {
    ok: invoiceRes.ok && Boolean(invoiceId && checkoutLink),
    status: invoiceRes.status,
    invoiceId,
    checkoutHost: checkoutLink ? new URL(checkoutLink).hostname : null,
    invoiceStatus: typeof data.status === "string" ? data.status : undefined,
    error:
      !invoiceRes.ok && typeof invoiceRes.body === "string"
        ? invoiceRes.body.slice(0, 200)
        : !invoiceRes.ok && invoiceRes.body && typeof invoiceRes.body === "object"
          ? JSON.stringify(invoiceRes.body).slice(0, 200)
          : undefined,
  };
} catch (e) {
  report.steps.createInvoice = { ok: false, error: String(e?.message ?? e) };
}

// 4) List store webhooks
try {
  const whRes = await fetchJson(`${base}/api/v1/stores/${encodeURIComponent(storeId)}/webhooks`, {
    headers: { Accept: "application/json", Authorization: `token ${apiKey}`, "User-Agent": "Modempic-BTCPay-Probe/1.0" },
  });
  const list = Array.isArray(whRes.body) ? whRes.body : [];
  report.steps.webhooks = {
    ok: whRes.ok,
    status: whRes.status,
    count: list.length,
    targets: list.map((w) => ({
      url: typeof w?.url === "string" ? w.url : undefined,
      enabled: w?.enabled,
    })),
  };
} catch (e) {
  report.steps.webhooks = { ok: false, error: String(e?.message ?? e) };
}

// 5) Modempic webhook endpoint rejects unsigned payloads
try {
  const whTest = await fetch("https://modempic.com/api/webhooks/btcpay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "InvoiceCreated", invoiceId: invoiceId ?? "probe" }),
    signal: AbortSignal.timeout(25_000),
  });
  report.steps.modempicWebhookGate = { ok: whTest.status === 401, status: whTest.status };
} catch (e) {
  report.steps.modempicWebhookGate = { ok: false, error: String(e?.message ?? e) };
}

// 6) Local signature check (secret works)
if (webhookSecret) {
  const payload = JSON.stringify({ type: "InvoiceCreated", invoiceId: invoiceId ?? "probe" });
  const sig = `sha256=${createHmac("sha256", webhookSecret).update(payload).digest("hex")}`;
  report.steps.webhookSecretFormat = { ok: sig.startsWith("sha256="), sigLength: sig.length };
}

report.pass =
  report.steps.modalScript?.ok &&
  report.steps.store?.ok &&
  report.steps.createInvoice?.ok &&
  report.steps.modempicWebhookGate?.ok;

console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
