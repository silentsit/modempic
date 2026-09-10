const CARD_CHECKOUT_TAB = "modempic-card-checkout";

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
  <div class="box">
    <div class="spinner" aria-hidden="true"></div>
    <h1>Preparing card checkout</h1>
    <p>Your order is being created. Do not leave this page. Secure payment opens here in a moment.</p>
  </div>
</body>
</html>`;

function cardCheckoutErrorHtml(message: string) {
  const safe = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  <div class="box">
    <h1>Card checkout could not open</h1>
    <p>${safe}</p>
    <p style="margin-top: 1rem;">Close this tab and finish on the Modempic checkout page.</p>
  </div>
</body>
</html>`;
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
    detachOpener(tab);
    writeCardCheckoutPlaceholder(tab, CARD_CHECKOUT_LOADING_HTML);
    return tab;
  } catch {
    return null;
  }
}

export function showCardCheckoutError(tab: Window | null, message: string) {
  writeCardCheckoutPlaceholder(tab, cardCheckoutErrorHtml(message));
}

export function openCardCheckoutTab(url: string) {
  if (typeof window === "undefined" || !url) return false;
  try {
    const tab = window.open(url, CARD_CHECKOUT_TAB);
    detachOpener(tab);
    return Boolean(tab);
  } catch {
    return false;
  }
}

export function assignCardCheckoutTab(tab: Window | null, url: string) {
  if (typeof window === "undefined" || !url) return false;
  try {
    if (tab && !tab.closed) {
      tab.location.replace(url);
      tab.focus();
      return true;
    }
  } catch {
    // Fall through to a fresh tab.
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
