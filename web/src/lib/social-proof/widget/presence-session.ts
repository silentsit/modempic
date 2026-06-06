import { PRESENCE_SESSION_KEY } from "./constants";

export function getOrCreatePresenceSessionId(): string {
  try {
    const existing = sessionStorage.getItem(PRESENCE_SESSION_KEY);
    if (existing?.trim()) return existing.trim();
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(PRESENCE_SESSION_KEY, id);
    return id;
  } catch {
    return `s-${Date.now()}`;
  }
}
