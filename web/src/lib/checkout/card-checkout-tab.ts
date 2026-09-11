const CARD_CHECKOUT_TAB = "modempic-card-checkout";
const CARD_CHECKOUT_CHANNEL = "modempic-card-checkout";
export const CARD_CHECKOUT_STALL_MS = 25_000;

const CARD_CHECKOUT_TIMEOUT_MESSAGE =
  "Card checkout did not open in time. Close this tab and go back to the Modempic checkout tab. If you already placed the order, open it from Your orders.";

function escapeHtml(message: string) {
  return message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cardCheckoutErrorInnerHtml(message: string) {
  return `<div class="box"><h1>Card checkout could not open</h1><p>${escapeHtml(message)}</p><p style="margin-top: 1rem;">Close this tab and finish on the Modempic checkout page.</p></div>`;
}

const CARD_CHECKOUT_LOADING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Opening card checkout | Modempic</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      background: #f8fafc;
      color: #475569;
    }
    .box { text-align: center; max-width: 22rem; }
    h1 { font-size: 1.125rem; font-weight: 600; color: #0f172a; margin: 0 0 0.5rem; }
    p { font-size: 0.875rem; line-height: 1.55; margin: 0; }
    .spinner {
      width: 2rem;
      height: 2rem;
      margin: 0 auto 1rem;
      border: 3px solid #e2e8f0;
      border-top-color: #0d9488;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="box" id="status">
    <div class="spinner" aria-hidden="true"></div>
    <h1>Preparing card checkout</h1>
    <p>Keep the Modempic checkout tab open. Payment usually opens here within about 20 seconds. If it does not, go back to that tab — do not wait on this page.</p>
  </div>
  <script>
    (function () {
      var done = false;
      function showError(msg) {
        if (done) return;
        done = true;
        document.title = "Card checkout unavailable | Modempic";
        var box = document.getElementById("status");
        if (!box) return;
        box.innerHTML = "";
        var heading = document.createElement("h1");
        heading.textContent = "Card checkout could not open";
        var detail = document.createElement("p");
        detail.textContent = String(msg || "");
        var next = document.createElement("p");
        next.style.marginTop = "1rem";
        next.textContent = "Close this tab and finish on the Modempic checkout page.";
        box.appendChild(heading);
        box.appendChild(detail);
        box.appendChild(next);
      }
      try {
        var ch = new BroadcastChannel(${JSON.stringify(CARD_CHECKOUT_CHANNEL)});
        ch.onmessage = function (ev) {
          var d = ev && ev.data ? ev.data : {};
          if (d.type === "url" && typeof d.url === "string" && d.url.indexOf("https://") === 0) {
            done = true;
            location.replace(d.url);
            return;
          }
          if (d.type === "error") {
            showError(d.message || ${JSON.stringify(CARD_CHECKOUT_TIMEOUT_MESSAGE)});
          }
        };
      } catch (e) {}
      setTimeout(function () {
        showError(${JSON.stringify(CARD_CHECKOUT_TIMEOUT_MESSAGE)});
      }, ${CARD_CHECKOUT_STALL_MS});
    })();
  </script>
</body>
</html>`;

function cardCheckoutErrorHtml(message: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Card checkout unavailable | Modempic</title>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: system-ui, sans-serif; background: #f8fafc; color: #475569; }
    .box { max-width: 22rem; text-align: center; }
    h1 { font-size: 1.125rem; color: #0f172a; margin: 0 0 0.5rem; }
    p { font-size: 0.875rem; line-height: 1.55; margin: 0; }
  </style>
</head>
<body>
  ${cardCheckoutErrorInnerHtml(message)}
</body>
</html>`;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function postCardCheckoutMessage(data: { type: "url"; url: string } | { type: "error"; message: string }) {
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel(CARD_CHECKOUT_CHANNEL);
    channel.postMessage(data);
    channel.close();
  } catch {
    // Channel unavailable in this browser.
  }
}

function writeCardCheckoutPlaceholder(tab: Window | null, html: string) {
  if (!tab || tab.closed) return;
  try {
    tab.document.open();
    tab.document.write(html);
    tab.document.close();
  } catch {
    // Tab may already be cross-origin.
  }
}

function detachOpener(tab: Window | null) {
  try {
    if (tab) tab.opener = null;
  } catch {
    // Handle already navigated to the hosted checkout.
  }
}

/** Opened during Pay with card so the tab survives the popup blocker. */
export function openCardCheckoutPlaceholder() {
  if (typeof window === "undefined") return null;
  try {
    const tab = window.open("about:blank", CARD_CHECKOUT_TAB);
    writeCardCheckoutPlaceholder(tab, CARD_CHECKOUT_LOADING_HTML);
    return tab;
  } catch {
    return null;
  }
}

export function showCardCheckoutError(tab: Window | null, message: string) {
  postCardCheckoutMessage({ type: "error", message });
  writeCardCheckoutPlaceholder(tab, cardCheckoutErrorHtml(message));
}

export function openCardCheckoutTab(url: string) {
  if (typeof window === "undefined" || !url || !isHttpsUrl(url)) return false;
  try {
    const tab = window.open(url, CARD_CHECKOUT_TAB);
    detachOpener(tab);
    return Boolean(tab);
  } catch {
    return false;
  }
}

export function assignCardCheckoutTab(tab: Window | null, url: string) {
  if (typeof window === "undefined" || !url || !isHttpsUrl(url)) return false;
  postCardCheckoutMessage({ type: "url", url });
  try {
    if (tab && !tab.closed) {
      tab.location.replace(url);
      detachOpener(tab);
      tab.focus();
      return true;
    }
  } catch {
    // Fall through to a named-window navigation.
  }
  return openCardCheckoutTab(url);
}

export function closeCardCheckoutTab(tab: Window | null) {
  try {
    tab?.close();
  } catch {
    // Popup may already be gone.
  }
}

export async function mintCardCheckoutFromBrowser(orderNumber: string): Promise<{
  url?: string;
  alreadyPaid?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch("/api/checkout/payment-handoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ orderNumber }),
      signal: AbortSignal.timeout(20_000),
    });
    let data: { ok?: boolean; url?: string; error?: string; alreadyPaid?: boolean } = {};
    try {
      data = (await res.json()) as typeof data;
    } catch {
      data = {};
    }
    if (data.alreadyPaid) return { alreadyPaid: true };
    if (res.ok && data.ok && data.url && isHttpsUrl(data.url)) return { url: data.url };
    return { error: data.error ?? "Could not open card checkout. Try again from the next page." };
  } catch {
    return { error: "Card checkout timed out. Try again from the next page." };
  }
}
