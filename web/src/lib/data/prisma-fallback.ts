/**
 * In local `next dev` only, Prisma failures (DB down, bad URL) return fallbacks so the UI still
 * runs. Production builds and production runtime must not swallow query errors — otherwise the
 * shop can be statically generated as an empty catalog and cached for an hour.
 */
const strict = process.env.PRISMA_STRICT === "1";
const inNextBuild =
  process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-development-build";
const useFallback =
  !strict && process.env.NODE_ENV === "development" && !inNextBuild;

export async function prismaDevOr<T>(label: string, op: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await op();
  } catch (e) {
    if (useFallback) {
      const ctx = inNextBuild ? "build" : "dev";
      console.warn(`[prisma] ${label} (${ctx}):`, e);
      return fallback;
    }
    throw e;
  }
}
