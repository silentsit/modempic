/** Resend SDK returns `{ message, name, ... }` — never use String() on it. */
export function formatResendError(error: unknown): string {
  if (error == null) return "Unknown email error";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const e = error as Record<string, unknown>;
    if (typeof e.message === "string" && e.message.trim()) return e.message;
    try {
      return JSON.stringify(error);
    } catch {
      return "Email send failed";
    }
  }
  return String(error);
}
