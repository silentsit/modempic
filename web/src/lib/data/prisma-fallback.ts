/**
 * In development, Prisma may fail (Postgres not running, bad DATABASE_URL, wrong credentials).
 * Return fallbacks so the UI and `auth()` still run. Set `PRISMA_STRICT=1` to surface real errors.
 * During `next build` (NEXT_PHASE) use the same fallbacks so static generation can complete without
 * a live database; at runtime in production, NEXT_PHASE is unset so errors still propagate.
 */
const strict = process.env.PRISMA_STRICT === "1";
const inNextBuild =
  process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-development-build";
const useFallback = !strict && (process.env.NODE_ENV === "development" || inNextBuild);

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
