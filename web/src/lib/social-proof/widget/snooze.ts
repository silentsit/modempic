import { DISMISS_SESSION_KEY } from "./constants";

export function jitterMs(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function readSnoozeUntil(): number {
  try {
    const raw = sessionStorage.getItem(DISMISS_SESSION_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function snoozeForHours(hours: number) {
  try {
    sessionStorage.setItem(DISMISS_SESSION_KEY, String(Date.now() + hours * 60 * 60 * 1000));
  } catch {
    /* private mode */
  }
}
